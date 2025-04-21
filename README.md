# Compliance Management System

A comprehensive API-based system for legal professionals in the construction industry to retrieve and analyze real-time compliance information.

## Features

- **Compliance Information Retrieval**: Get real-time compliance updates and legal information
- **Document Processing**: Extract and analyze text from legal documents
- **API Integration**: Integrates with Perplexity Sonar API, Mistral OCR, and Google Gemini
- **Authentication**: Secure JWT-based authentication system
- **MongoDB Database**: Separate databases for development, testing, and production

## Technologies

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB
- **Testing**: Jest
- **Documentation**: OpenAPI/Swagger

## External API Integrations

- **Perplexity Sonar API**: For real-time data from government and news sources
- **Mistral OCR**: For document text extraction
- **Google Gemini**: For analysis and summaries

## Project Structure

```
├── src/
│   ├── api/
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Express middlewares
│   │   ├── routes/          # API routes
│   │   └── validators/      # Request validation
│   ├── config/              # Application configuration
│   ├── db/                  # Database setup and models
│   ├── integrations/        # External API integration
│   │   ├── perplexity/      # Perplexity API
│   │   ├── mistral/         # Mistral OCR API
│   │   └── gemini/          # Google Gemini API
│   ├── models/              # Mongoose models
│   ├── services/            # Business logic
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── tests/                   # Test files
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
└── dist/                    # Compiled code
```

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- MongoDB 4.x or higher
- API keys for Perplexity, Mistral, and Google Gemini

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/compliance-management.git
   cd compliance-management
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials and API keys

5. Start the development server
   ```bash
   npm run dev
   ```

### Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run lint`: Run linter

## API Documentation

Once the server is running, API documentation is available at:
```
http://localhost:3000/api/v1/docs
```

## License

[MIT](LICENSE)

## Environment Configuration

The system uses a centralized environment configuration that validates all required API keys and settings on startup:

### Configuration Features

- **Centralized Config**: Single source of truth for environment variables
- **Type Safety**: TypeScript interfaces for configuration values
- **Validation**: Automatic validation of required API keys on application startup
- **Environment-Based**: Automatically selects the correct configuration based on the current environment
- **Default Values**: Sensible defaults for optional configuration parameters

### Required Environment Variables

The following environment variables are **required** for the application to start:

- `JWT_SECRET`: Secret key for JWT token generation
- `PERPLEXITY_API_KEY`: API key for Perplexity Sonar API
- `MISTRAL_API_KEY`: API key for Mistral OCR API
- `GEMINI_API_KEY`: API key for Google Gemini API
- Environment-specific MongoDB URI (`MONGODB_URI_DEV`, `MONGODB_URI_TEST`, or `MONGODB_URI_PROD`)

If any of these required variables are missing, the application will fail to start and log the specific missing variables.

### Setting Up Environment Variables

1. Copy the `.env.example` file to create a `.env` file
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual values, especially the required API keys

3. For production deployment, set the environment variables directly in your hosting environment

## MongoDB Configuration

The system uses MongoDB Atlas for data storage with separate databases for different environments:

- Development: `compliance-dev`
- Testing: `compliance-test`
- Production: `compliance-prod`

### Setup Instructions

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) if you don't have one
2. Set up a new cluster or use an existing one
3. Create a database user with appropriate permissions
4. Get your connection string from the MongoDB Atlas dashboard
5. Create a `.env` file in the root directory based on `.env.example`
6. Set the appropriate MongoDB connection strings and password:

```
# MongoDB Configuration
MONGODB_URI_DEV=mongodb+srv://username:<db_password>@your-cluster-url.mongodb.net/compliance-dev?retryWrites=true&w=majority
MONGODB_URI_TEST=mongodb+srv://username:<db_password>@your-cluster-url.mongodb.net/compliance-test?retryWrites=true&w=majority
MONGODB_URI_PROD=mongodb+srv://username:<db_password>@your-cluster-url.mongodb.net/compliance-prod?retryWrites=true&w=majority
MONGODB_PASSWORD=your_actual_database_password
```

### Environment-Specific Configuration

The system automatically selects the appropriate database based on the `NODE_ENV` environment variable:

- When `NODE_ENV=development`: Uses the development database (default)
- When `NODE_ENV=test`: Uses the testing database
- When `NODE_ENV=production`: Uses the production database

### MongoDB Connection Features

The MongoDB connection is configured with the following features:

- Connection pooling (5-10 connections)
- Automatic retries for reads and writes
- Timeout settings for better error handling
- Majority write concern for data durability
- Production-specific optimizations (e.g., disabled autoIndexing)
- Secure connection string handling (passwords masked in logs)

### Testing Database Connections

To test the database connections for all environments:

```bash
npm run test:db
```

This script will attempt to connect to all three environment databases, create a test document, read it back, and then delete it.

## Security Best Practices

### Handling Sensitive Data

To ensure security of sensitive credentials and API keys, follow these guidelines:

1. **Environment Variables**: 
   - Never commit `.env` files to version control
   - Always use `.env.example` as a template with placeholders
   - Store actual credentials outside the repository

2. **MongoDB Credentials**: 
   - Use environment variables for all database credentials
   - Create separate database users for development, testing, and production
   - Follow the principle of least privilege for database users
   - Regularly rotate database passwords

3. **API Keys**: 
   - Store all API keys as environment variables
   - Never hardcode API keys in source code
   - Create separate API keys for development and production
   - Regularly rotate API keys

4. **Local Development**: 
   - Keep your `.env` file local and never share it
   - Use environment-specific configurations
   - Consider using a secrets manager for team environments

5. **Production Deployment**: 
   - Use a secure secrets management solution (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Set environment variables directly in your hosting environment
   - Consider encrypting sensitive values at rest

### Environment File Setup

```bash
# Create your local environment file from the example
cp .env.example .env

# Edit your .env file to add your actual credentials
# NEVER commit this file to Git
```

### Security Auditing

Regularly audit your codebase for potential security issues:

```bash
# Run security audit on dependencies
npm audit

# Fix security issues when possible
npm audit fix
``` 