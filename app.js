const http = require('http');
const mongodb = require('mongodb');
const qs = require('querystring');
const MongoClient = mongodb.MongoClient;

// 🔹 Load MongoDB credentials from environment variables
const mongo_host = process.env.MONGO_DB_HOST || 'mongo-service';
const mongo_port = process.env.MONGO_DB_PORT || '27017';
const mongo_user = process.env.MONGO_DB_USERNAME || 'root';
const mongo_pass = process.env.MONGO_DB_PASSWORD || 'mongo';

// 🔹 Construct the MongoDB connection URL
const mongo_url = `mongodb://${mongo_user}:${mongo_pass}@${mongo_host}:${mongo_port}/admin`;

const port = process.env.PORT || 8888;

console.log(`🔍 Attempting to connect to MongoDB at: ${mongo_url}`);

// 🔹 Create the HTTP server
http.createServer((req, res) => {
    switch (req.method) {
        case 'GET':
            if (req.url === '/') {
                createHomePage(res);
            } else if (req.url === '/AddEmployee') {
                addEmployeeForm(res);
            } else if (req.url === '/GetEmployee') {
                getEmployeeForm(res);
            } else if (req.url === '/UpdateEmployee') {
                updateEmployeeForm(res);
            } else if (req.url === '/DeleteEmployee') {
                deleteEmployeeForm(res);
            }
            break;

        case 'POST':
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            req.on('end', () => {
                const formData = qs.parse(body);
                if (req.url === '/AddEmployee') {
                    addEmployee(res, formData);
                } else if (req.url === '/GetEmployee') {
                    getEmployee(res, formData);
                } else if (req.url === '/UpdateEmployee') {
                    updateEmployee(res, formData);
                } else if (req.url === '/DeleteEmployee') {
                    deleteEmployee(res, formData);
                }
            });
            break;
    }
}).listen(port, () => {
    console.log(`🚀 Server running at http://127.0.0.1:${port}`);
});

// 🔹 Function to create the home page
function createHomePage(res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write("<html><body style='background-color:lightyellow;'><center>");
    res.write("<h1>Employee Management System</h1>");
    res.write("<button onclick=\"location.href='/AddEmployee'\">Add Employee</button>");
    res.write("<button onclick=\"location.href='/GetEmployee'\">Get Employee</button>");
    res.write("<button onclick=\"location.href='/UpdateEmployee'\">Update Employee</button>");
    res.write("<button onclick=\"location.href='/DeleteEmployee'\">Delete Employee</button>");
    res.write("</center></body></html>");
    res.end();
}

// 🔹 Function to add an employee
function addEmployee(res, data) {
    MongoClient.connect(mongo_url, (err, client) => {
        if (err) {
            console.error('❌ MongoDB connection error:', err);
            res.end('Database connection failed');
            return;
        }

        const db = client.db('admin');
        const collection = db.collection('employee');

        const employee = {
            firstname: data.fname,
            lastname: data.lname,
            id: parseInt(data.empid),
            dept: data.dept,
            dsgn: data.dsgn,
            salary: parseFloat(data.sal)
        };

        collection.insertOne(employee, (err, result) => {
            if (err) {
                console.error('❌ Error inserting employee:', err);
                res.end('Failed to add employee');
            } else {
                console.log(`✅ Employee added successfully: ${employee.id}`);
                res.end(`Employee ${employee.id} added successfully`);
            }
            client.close();
        });
    });
}

// 🔹 Function to get employee details
function getEmployee(res, data) {
    MongoClient.connect(mongo_url, (err, client) => {
        if (err) {
            console.error('❌ MongoDB connection error:', err);
            res.end('Database connection failed');
            return;
        }

        const db = client.db('admin');
        const collection = db.collection('employee');

        collection.findOne({ id: parseInt(data.empid) }, (err, employee) => {
            if (err) {
                console.error('❌ Error fetching employee:', err);
                res.end('Failed to get employee');
            } else if (!employee) {
                res.end(`No employee found with ID ${data.empid}`);
            } else {
                console.log(`✅ Employee found: ${JSON.stringify(employee)}`);
                res.end(`Employee Details: ${JSON.stringify(employee)}`);
            }
            client.close();
        });
    });
}

// 🔹 Function to update an employee
function updateEmployee(res, data) {
    MongoClient.connect(mongo_url, (err, client) => {
        if (err) {
            console.error('❌ MongoDB connection error:', err);
            res.end('Database connection failed');
            return;
        }

        const db = client.db('admin');
        const collection = db.collection('employee');

        collection.updateOne(
            { id: parseInt(data.empid) },
            { $set: { dsgn: data.dsgn, salary: parseFloat(data.sal) } },
            (err, result) => {
                if (err) {
                    console.error('❌ Error updating employee:', err);
                    res.end('Failed to update employee');
                } else if (result.matchedCount === 0) {
                    res.end(`No employee found with ID ${data.empid}`);
                } else {
                    console.log(`✅ Employee updated: ${data.empid}`);
                    res.end(`Employee ${data.empid} updated successfully`);
                }
                client.close();
            }
        );
    });
}

// 🔹 Function to delete an employee
function deleteEmployee(res, data) {
    MongoClient.connect(mongo_url, (err, client) => {
        if (err) {
            console.error('❌ MongoDB connection error:', err);
            res.end('Database connection failed');
            return;
        }

        const db = client.db('admin');
        const collection = db.collection('employee');

        collection.deleteOne({ id: parseInt(data.empid) }, (err, result) => {
            if (err) {
                console.error('❌ Error deleting employee:', err);
                res.end('Failed to delete employee');
            } else if (result.deletedCount === 0) {
                res.end(`No employee found with ID ${data.empid}`);
            } else {
                console.log(`✅ Employee deleted: ${data.empid}`);
                res.end(`Employee ${data.empid} deleted successfully`);
            }
            client.close();
        });
    });
}
