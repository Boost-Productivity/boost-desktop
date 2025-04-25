from flask import Flask, jsonify, request
import sys
import logging
import os
from ariadne import ObjectType, QueryType, MutationType, gql, make_executable_schema
from dotenv import load_dotenv
import json
from datetime import datetime
from flask_cors import CORS
from couchdb_manager import CouchDBManager

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

app = Flask(__name__)
CORS(app)

# Initialize CouchDB manager
db_manager = CouchDBManager()

# Try to connect to CouchDB
db = db_manager.get_or_create_db('flows')
if not db:
    logging.warning("CouchDB connection failed, using in-memory storage as fallback")
    flow_store = {}
else:
    logging.info("Connected to CouchDB")
    flow_store = None

# GraphQL schema definition
type_defs = gql("""
    type Position {
        x: Float!
        y: Float!
    }
    
    type NodeData {
        label: String
        content: String
    }
    
    type Node {
        id: ID!
        type: String!
        position: Position!
        data: NodeData
    }
    
    type Edge {
        id: ID!
        source: String!
        target: String!
        type: String
        animated: Boolean
    }
    
    type Flow {
        id: ID!
        name: String!
        nodes: [Node!]!
        edges: [Edge!]!
        createdAt: String!
        updatedAt: String!
    }
    
    input PositionInput {
        x: Float!
        y: Float!
    }
    
    input NodeDataInput {
        label: String
        content: String
    }
    
    input NodeInput {
        id: ID!
        type: String!
        position: PositionInput!
        data: NodeDataInput
    }
    
    input EdgeInput {
        id: ID!
        source: String!
        target: String!
        type: String
        animated: Boolean
    }
    
    input FlowInput {
        id: ID!
        name: String!
        nodes: [NodeInput!]!
        edges: [EdgeInput!]!
        createdAt: String
        updatedAt: String
    }
    
    type Query {
        flows: [Flow!]!
        flow(id: ID!): Flow
    }
    
    type Mutation {
        createFlow(name: String!): Flow!
        updateFlow(flow: FlowInput!): Flow!
        deleteFlow(id: ID!): Boolean!
    }
""")

# Resolvers
query = QueryType()
mutation = MutationType()

@query.field("flows")
def resolve_flows(*_):
    logging.info("GraphQL Query: flows")
    
    if flow_store is not None:
        # Using in-memory storage
        flows_list = list(flow_store.values())
        logging.info(f"Returning {len(flows_list)} flows from memory")
        return flows_list
    else:
        # Using CouchDB
        flows = db_manager.get_all_flows()
        
        # If no flows exist, create a sample flow
        if not flows:
            logging.info("No flows found, creating a sample flow")
            sample_id = "sample-flow-1"
            sample_flow = {
                "id": sample_id,
                "name": "Sample Flow",
                "nodes": [
                    {
                        "id": "node-sample-1",
                        "type": "default",
                        "position": {"x": 250, "y": 150},
                        "data": {"label": "Sample Node"}
                    }
                ],
                "edges": [],
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat()
            }
            db_manager.save_flow(sample_flow)
            flows = [sample_flow]
            
        logging.info(f"Returning {len(flows)} flows from CouchDB")
        return flows

@query.field("flow")
def resolve_flow(_, info, id):
    logging.info(f"GraphQL Query: flow(id: {id})")
    
    if flow_store is not None:
        # Using in-memory storage
        if id in flow_store:
            return flow_store[id]
        return None
    else:
        # Using CouchDB
        return db_manager.get_flow(id)

@mutation.field("createFlow")
def resolve_create_flow(_, info, name):
    logging.info(f"GraphQL Mutation: createFlow(name: {name})")
    import uuid
    
    # Generate a unique ID for the new flow
    flow_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    # Create a new flow
    new_flow = {
        "id": flow_id,
        "name": name,
        "nodes": [],
        "edges": [],
        "createdAt": now,
        "updatedAt": now
    }
    
    if flow_store is not None:
        # Using in-memory storage
        flow_store[flow_id] = new_flow
        logging.info(f"Created new flow with ID {flow_id} in memory")
    else:
        # Using CouchDB
        db_manager.save_flow(new_flow)
        logging.info(f"Created new flow with ID {flow_id} in CouchDB")
    
    return new_flow

@mutation.field("updateFlow")
def resolve_update_flow(_, info, flow):
    logging.info(f"GraphQL Mutation: updateFlow(id: {flow['id']})")
    
    flow_id = flow["id"]
    flow["updatedAt"] = datetime.now().isoformat()
    
    if flow_store is not None:
        # Using in-memory storage
        if flow_id in flow_store:
            flow_store[flow_id] = flow
            logging.info(f"Updated flow with ID {flow_id} in memory")
            return flow
        logging.error(f"Flow with ID {flow_id} not found in memory")
        return None
    else:
        # Using CouchDB
        if db_manager.save_flow(flow):
            logging.info(f"Updated flow with ID {flow_id} in CouchDB")
            return flow
        logging.error(f"Failed to update flow with ID {flow_id} in CouchDB")
        return None

@mutation.field("deleteFlow")
def resolve_delete_flow(_, info, id):
    logging.info(f"GraphQL Mutation: deleteFlow(id: {id})")
    
    if flow_store is not None:
        # Using in-memory storage
        if id in flow_store:
            del flow_store[id]
            logging.info(f"Deleted flow with ID {id} from memory")
            return True
        logging.warning(f"Flow with ID {id} not found in memory")
        return False
    else:
        # Using CouchDB
        return db_manager.delete_flow(id)

# Create executable schema
schema = make_executable_schema(type_defs, query, mutation)

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    logging.info("Health check requested")
    return jsonify({
        "status": "running",
        "couchdb": db is not None
    })

# GraphQL endpoint
@app.route('/graphql', methods=['POST'])
def graphql_server():
    data = request.json
    from ariadne import graphql_sync
    success, result = graphql_sync(
        schema,
        data.get('query', ''),
        variable_values=data.get('variables', {}),
        context_value={"request": request}
    )
    status_code = 200 if success else 400
    return jsonify(result), status_code

# Legacy REST endpoints for backward compatibility
@app.route('/api/flows', methods=['GET'])
def get_flows():
    logging.info("REST API: GET /api/flows")
    
    if flow_store is not None:
        # Using in-memory storage
        flows_list = list(flow_store.values())
        logging.info(f"Returning {len(flows_list)} flows from memory via REST API")
        return jsonify(flows_list)
    else:
        # Using CouchDB
        flows = db_manager.get_all_flows()
        
        # If no flows exist, create a sample flow
        if not flows:
            logging.info("No flows found, creating a sample flow")
            sample_id = "sample-flow-1"
            sample_flow = {
                "id": sample_id,
                "name": "Sample Flow",
                "nodes": [
                    {
                        "id": "node-sample-1",
                        "type": "default",
                        "position": {"x": 250, "y": 150},
                        "data": {"label": "Sample Node"}
                    }
                ],
                "edges": [],
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat()
            }
            db_manager.save_flow(sample_flow)
            flows = [sample_flow]
            
        logging.info(f"Returning {len(flows)} flows from CouchDB via REST API")
        return jsonify(flows)

@app.route('/api/flows/<flow_id>', methods=['GET'])
def get_flow(flow_id):
    logging.info(f"REST API: GET /api/flows/{flow_id}")
    
    if flow_store is not None:
        # Using in-memory storage
        if flow_id in flow_store:
            return jsonify(flow_store[flow_id])
        return jsonify({"success": False, "message": f"Flow with ID {flow_id} not found"}), 404
    else:
        # Using CouchDB
        flow = db_manager.get_flow(flow_id)
        if flow:
            return jsonify(flow)
        return jsonify({"success": False, "message": f"Flow with ID {flow_id} not found"}), 404

@app.route('/api/flows', methods=['POST'])
def save_flow():
    flow_data = request.json
    flow_id = flow_data.get('id')
    logging.info(f"REST API: POST /api/flows for flow_id: {flow_id}")
    
    if not flow_id:
        return jsonify({"success": False, "message": "Flow ID is required"}), 400
    
    # Update timestamp
    flow_data['updatedAt'] = datetime.now().isoformat()
    
    if flow_store is not None:
        # Using in-memory storage
        flow_store[flow_id] = flow_data
        logging.info(f"Flow {flow_id} saved to memory successfully")
    else:
        # Using CouchDB
        if not db_manager.save_flow(flow_data):
            return jsonify({"success": False, "message": "Failed to save flow to CouchDB"}), 500
        logging.info(f"Flow {flow_id} saved to CouchDB successfully")
    
    return jsonify({"success": True, "message": f"Flow with ID {flow_id} saved"})

@app.route('/api/flows/<flow_id>', methods=['DELETE'])
def delete_flow(flow_id):
    logging.info(f"REST API: DELETE /api/flows/{flow_id}")
    
    if flow_store is not None:
        # Using in-memory storage
        if flow_id in flow_store:
            del flow_store[flow_id]
            logging.info(f"Flow {flow_id} deleted from memory successfully")
            return jsonify({"success": True, "message": f"Flow with ID {flow_id} deleted"})
        return jsonify({"success": False, "message": f"Flow with ID {flow_id} not found"}), 404
    else:
        # Using CouchDB
        if db_manager.delete_flow(flow_id):
            return jsonify({"success": True, "message": f"Flow with ID {flow_id} deleted"})
        return jsonify({"success": False, "message": f"Flow with ID {flow_id} not found"}), 404

if __name__ == '__main__':
    # Get port from command line arguments or use default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    
    # Log startup
    logging.info(f"Starting Python server with GraphQL and CouchDB on port {port}")
    
    # Run the Flask app
    app.run(host='127.0.0.1', port=port, debug=False) 