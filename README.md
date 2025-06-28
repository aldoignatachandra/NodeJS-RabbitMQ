# 🐰 Node.js RabbitMQ Integration

A demonstration project showcasing how to integrate RabbitMQ with Node.js for message queuing in a production-ready, maintainable architecture. This project implements a robust publish-subscribe pattern using modern JavaScript practices.

# ✅ Main Features

- 📨 **Message Publishing**: Produce messages for async processing
- 📬 **Message Consumption**: Process messages from queues with error handling
- 🔄 **Connection Management**: Robust connection handling with auto-reconnection
- 🔒 **Reliable Messaging**: Durable exchanges and queues with persistence
- 🏗️ **Clean Architecture**: Service-oriented design with clear separation of concerns
- 📝 **Detailed Logging**: Comprehensive logging with Winston

# ⚙️ Tech Highlights

## 🧱 Architecture

- **Service-Oriented Design**: Services handle specific business domains
- **Message Broker Pattern**: Decoupled components communicating via message queues
- **Repository Pattern**: Modular data access with clean interfaces
- **Error Handling**: Comprehensive error handling with custom error classes

## 🔧 Technologies

- **Node.js**: JavaScript runtime environment
- **RabbitMQ**: Message broker for reliable message delivery
- **Express**: Web server framework for REST APIs
- **Winston**: Logging utility for better observability
- **UUID**: For generating unique message identifiers
- **Jest**: Testing framework for unit and integration tests

## 🧪 Testing & Quality

- **Unit Tests**: Jest-based testing for individual components
- **Integration Tests**: Testing component interactions
- **Error Scenario Tests**: Ensuring robust error handling

# 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/aldoignatachandra/NodeJS-RabbitMQ.git
cd nodejs-rabbitmq

# Install dependencies
npm install / yarn install

# Setup environment variables
cp .env.example .env

# Start RabbitMQ using Docker
docker compose up -d

# Run the Express server
npm start / yarn start

# Run the producer standalone
npm run producer / yarn producer

# Run the consumer standalone
npm run consumer / yarn consumer
```

# 🔄 RabbitMQ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│                 │     │                  │     │                    │
│  Express API    │────▶│   User Service   │────▶│  RabbitMQ Exchange │
│  (HTTP Server)  │     │                  │     │                    │
│                 │     └──────────────────┘     └─────────┬──────────┘
└─────────────────┘                                        │
                                                           │
                                                           ▼
                    ┌──────────────────┐     ┌────────────────────┐
                    │                  │     │                    │
                    │ Notification     │◀────│   RabbitMQ Queue   │
                    │ Service          │     │                    │
                    │                  │     │                    │
                    └──────────────────┘     └────────────────────┘
```

# 🔌 API Endpoints

The application provides a RESTful API for interacting with the system:

- `GET /api` - API information
- `POST /api/users` - Register a new user (publishes a message)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a user by ID

# 📦 Project Structure

```
├── src/
│   ├── config/           # Configuration files
│   │   ├── rabbitmq.js   # RabbitMQ configuration
│   │   ├── logger.js     # Logging configuration
│   │   ├── server.js     # Server configuration
│   │   └── index.js      # Configuration exports
│   ├── controllers/      # API request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── rabbitmq/         # RabbitMQ integration
│   │   ├── connection.js # Connection management
│   │   ├── consumer.js   # Message consumer
│   │   ├── publisher.js  # Message publisher
│   │   └── index.js      # Module exports
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   ├── app.js            # Express application setup
│   ├── index.js          # Application entry point
│   ├── producer.js       # Standalone producer script
│   └── consumer.js       # Standalone consumer script
├── tests/                # Test files
├── docker-compose.yml    # Docker configuration
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

# 🧪 Testing

```bash
# Run all tests
npm test / yarn test

# Run tests in watch mode
npm run test:watch / yarn test:watch
```

# 🐳 RabbitMQ Management Console

Access the RabbitMQ Management Console at http://localhost:15672/ with:

- Username: `admin`
- Password: `admin123`

# 📝 Example Message Flow

### Producer Output

```
[2023-10-15 14:30:22] [info]: Initializing publisher...
[2023-10-15 14:30:22] [info]: Publisher initialized: Exchange 'message_exchange' created/verified
[2023-10-15 14:30:22] [info]: Publishing message for user: john.doe@example.com
[2023-10-15 14:30:22] [info]: Message published to exchange 'message_exchange' with routing key 'message.new'
[2023-10-15 14:30:22] [info]: Successfully published message for user: john.doe@example.com
```

### Consumer Output

```
[2023-10-15 14:30:25] [info]: Initializing consumer...
[2023-10-15 14:30:25] [info]: Consumer initialized: Queue 'message_queue' bound to exchange 'message_exchange'
[2023-10-15 14:30:25] [info]: Starting to consume messages...
[2023-10-15 14:30:25] [info]: Consumer is running. Press Ctrl+C to exit.
[2023-10-15 14:30:30] [info]: Received message: 550e8400-e29b-41d4-a716-446655440000 (user.registered)
[2023-10-15 14:30:30] [info]: ========================================
[2023-10-15 14:30:30] [info]: NEW USER REGISTERED
[2023-10-15 14:30:30] [info]: ----------------------------------------
[2023-10-15 14:30:30] [info]: ID:    550e8400-e29b-41d4-a716-446655440000
[2023-10-15 14:30:30] [info]: Email: john.doe@example.com
[2023-10-15 14:30:30] [info]: Name:  John Doe
[2023-10-15 14:30:30] [info]: User registration processed successfully
```

# 📋 Configuration Options

The application supports the following environment variables:

| Variable             | Description                                 | Default Value    |
| -------------------- | ------------------------------------------- | ---------------- |
| PORT                 | Port for the HTTP server                    | 3000             |
| NODE_ENV             | Environment (development, production, test) | development      |
| RABBITMQ_HOST        | RabbitMQ server hostname                    | localhost        |
| RABBITMQ_PORT        | RabbitMQ server port                        | 5672             |
| RABBITMQ_USER        | RabbitMQ username                           | admin            |
| RABBITMQ_PASSWORD    | RabbitMQ password                           | admin123         |
| RABBITMQ_VHOST       | RabbitMQ virtual host                       | /                |
| RABBITMQ_EXCHANGE    | RabbitMQ exchange name                      | message_exchange |
| RABBITMQ_QUEUE       | RabbitMQ queue name                         | message_queue    |
| RABBITMQ_ROUTING_KEY | RabbitMQ routing key                        | message.new      |

# 🧩 Areas for Improvement

- 📝 **Additional Tests**: Increase test coverage for error scenarios
- 🔄 **Message Retries**: Implement dead-letter queues for failed messages
- 🔐 **Authentication**: Add JWT-based authentication for API endpoints
- 🐳 **Docker Compose**: Improve containerization with more services
- 📊 **Monitoring**: Add Prometheus/Grafana for operational metrics

# 🙏 Final Notes

This project demonstrates:

- ✅ **Clean Architecture**: Clear separation of concerns
- ✅ **Error Handling**: Robust error management
- ✅ **Asynchronous Processing**: Scalable message-based architecture
- ✅ **Modern JavaScript**: ES6+ with ESM modules

---

**Note:** This project is designed as a learning resource for understanding message queue patterns with Node.js and RabbitMQ. It can be used as a starting point for production systems but would need additional hardening for high-volume environments.

---

## 👨‍💻 Author

Created with 💻 by Ignata

- 📂 GitHub: [Aldo Ignata Chandra](https://github.com/aldoignatachandra)
- 💼 LinkedIn: [Aldo Ignata Chandra](https://linkedin.com/in/aldoignatachandra)

---
