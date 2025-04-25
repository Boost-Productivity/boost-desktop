from flask import Flask, jsonify, request
import sys
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

app = Flask(__name__)

# Store data in memory (you could connect to a database here instead)
data_store = {}
flow_store = {}  # New storage for flows

@app.route('/api/health', methods=['GET'])
def health_check():
    logging.info("Health check requested")
    return jsonify({"status": "running"})

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify(data_store)

@app.route('/api/data', methods=['POST'])
def add_data():
    new_data = request.json
    key = new_data.get('key')
    if key:
        data_store[key] = new_data
        return jsonify({"success": True, "message": f"Data with key {key} added"})
    return jsonify({"success": False, "message": "Key is required"}), 400

@app.route('/api/data/<key>', methods=['DELETE'])
def delete_data(key):
    if key in data_store:
        del data_store[key]
        return jsonify({"success": True, "message": f"Data with key {key} deleted"})
    return jsonify({"success": False, "message": f"Key {key} not found"}), 404

# New endpoint to get all flows
@app.route('/api/flows', methods=['GET'])
def get_flows():
    logging.info(f"GET /api/flows called, current flow_store: {flow_store}")
    # Initialize with an empty flow if none exist
    if not flow_store:
        logging.info("Flow store is empty, initializing with a sample flow")
        sample_id = "sample-flow-1"
        flow_store[sample_id] = {
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
            "createdAt": "2023-01-01T00:00:00.000Z",
            "updatedAt": "2023-01-01T00:00:00.000Z"
        }
    flows_list = list(flow_store.values())
    logging.info(f"Returning {len(flows_list)} flows")
    return jsonify(flows_list)

# New endpoint to get a specific flow
@app.route('/api/flows/<flow_id>', methods=['GET'])
def get_flow(flow_id):
    logging.info(f"GET /api/flows/{flow_id} called")
    if flow_id in flow_store:
        return jsonify(flow_store[flow_id])
    return jsonify({"success": False, "message": f"Flow with ID {flow_id} not found"}), 404

# New endpoint to save a flow
@app.route('/api/flows', methods=['POST'])
def save_flow():
    flow_data = request.json
    flow_id = flow_data.get('id')
    logging.info(f"POST /api/flows called with flow_id: {flow_id}")
    if not flow_id:
        return jsonify({"success": False, "message": "Flow ID is required"}), 400
    
    flow_store[flow_id] = flow_data
    logging.info(f"Flow {flow_id} saved successfully, total flows: {len(flow_store)}")
    return jsonify({"success": True, "message": f"Flow with ID {flow_id} saved"})

# New endpoint to delete a flow
@app.route('/api/flows/<flow_id>', methods=['DELETE'])
def delete_flow(flow_id):
    logging.info(f"DELETE /api/flows/{flow_id} called")
    if flow_id in flow_store:
        del flow_store[flow_id]
        return jsonify({"success": True, "message": f"Flow with ID {flow_id} deleted"})
    return jsonify({"success": False, "message": f"Flow with ID {flow_id} not found"}), 404

if __name__ == '__main__':
    # Get port from command line arguments or use default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    
    # Log startup
    logging.info(f"Starting Python server on port {port}")
    
    # Run the Flask app
    app.run(host='127.0.0.1', port=port, debug=False) 