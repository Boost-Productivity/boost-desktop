import os
import logging
import couchdb
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class CouchDBManager:
    def __init__(self):
        self.logger = logging.getLogger('CouchDBManager')
        self.couchdb_url = os.getenv('COUCHDB_URL', 'http://localhost:5984')
        self.admin_user = os.getenv('COUCHDB_USER', 'admin')
        self.admin_password = os.getenv('COUCHDB_PASSWORD', 'password')
        self.server = None
        self.db = None
    
    def connect(self):
        """Connect to CouchDB and return the server instance"""
        try:
            self.logger.info(f"Connecting to CouchDB at {self.couchdb_url}")
            self.server = couchdb.Server(self.couchdb_url)
            self.server.resource.credentials = (self.admin_user, self.admin_password)
            return self.server
        except Exception as e:
            self.logger.error(f"Error connecting to CouchDB: {e}")
            return None
    
    def get_or_create_db(self, db_name='flows'):
        """Get or create a database"""
        try:
            if not self.server:
                self.connect()
                
            if not self.server:
                self.logger.error("No CouchDB connection available")
                return None
                
            # Create or get the flows database
            if db_name in self.server:
                self.db = self.server[db_name]
                self.logger.info(f"Connected to existing '{db_name}' database")
            else:
                self.db = self.server.create(db_name)
                self.logger.info(f"Created '{db_name}' database")
            
            return self.db
        except Exception as e:
            self.logger.error(f"Error getting/creating database: {e}")
            return None
    
    def save_flow(self, flow_data):
        """Save a flow document to the database"""
        try:
            if not self.db:
                self.get_or_create_db()
                
            if not self.db:
                self.logger.error("No database connection available")
                return False
                
            flow_id = flow_data['id']
            
            # Check if document exists to get _rev for update
            if flow_id in self.db:
                existing = self.db[flow_id]
                flow_data['_id'] = flow_id
                flow_data['_rev'] = existing['_rev']
            else:
                flow_data['_id'] = flow_id
                
            self.db[flow_id] = flow_data
            self.logger.info(f"Saved flow with ID {flow_id}")
            return True
        except Exception as e:
            self.logger.error(f"Error saving flow: {e}")
            return False
    
    def get_flow(self, flow_id):
        """Get a flow by ID"""
        try:
            if not self.db:
                self.get_or_create_db()
                
            if not self.db:
                self.logger.error("No database connection available")
                return None
                
            if flow_id in self.db:
                doc = self.db[flow_id]
                # Remove CouchDB specific fields
                if '_id' in doc:
                    del doc['_id']
                if '_rev' in doc:
                    del doc['_rev']
                return doc
            
            self.logger.warning(f"Flow with ID {flow_id} not found")
            return None
        except Exception as e:
            self.logger.error(f"Error getting flow {flow_id}: {e}")
            return None
    
    def get_all_flows(self):
        """Get all flows"""
        try:
            if not self.db:
                self.get_or_create_db()
                
            if not self.db:
                self.logger.error("No database connection available")
                return []
                
            flows = []
            for doc_id in self.db:
                if not doc_id.startswith('_'):
                    doc = self.db[doc_id]
                    # Remove CouchDB specific fields
                    if '_id' in doc:
                        del doc['_id']
                    if '_rev' in doc:
                        del doc['_rev']
                    flows.append(doc)
            
            return flows
        except Exception as e:
            self.logger.error(f"Error getting all flows: {e}")
            return []
    
    def delete_flow(self, flow_id):
        """Delete a flow by ID"""
        try:
            if not self.db:
                self.get_or_create_db()
                
            if not self.db:
                self.logger.error("No database connection available")
                return False
                
            if flow_id in self.db:
                del self.db[flow_id]
                self.logger.info(f"Deleted flow with ID {flow_id}")
                return True
            
            self.logger.warning(f"Flow with ID {flow_id} not found for deletion")
            return False
        except Exception as e:
            self.logger.error(f"Error deleting flow {flow_id}: {e}")
            return False 