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