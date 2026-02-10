# Escrow API

A secure Node.js/TypeScript REST API for managing escrow transactions between payers and payees.

## 🚀 Features

- **JWT Authentication** with refresh token support
- **Role-based Access Control** (payer/payee roles)
- **Escrow Management** with multiple release conditions
- **PostgreSQL Database** with Drizzle ORM
- **Swagger Documentation** for all API endpoints
- **Secure Password Handling** with bcrypt
- **CORS Configuration** for frontend integration

## 🛠️ Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with refresh tokens
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: bcrypt, CORS, role-based access control
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- pnpm package manager

## 🚀 Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd api
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
PORT=3000
PG_URL=postgresql://username:password@localhost:5432/database_name
SECRET=your-super-secret-jwt-key
```

4. **Run database migrations**
```bash
pnpm run push
```

5. **Start the development server**
```bash
pnpm run dev
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Swagger UI
Visit `http://localhost:3000/api-docs` for interactive API documentation.

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "payer"  // or "payee"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Refresh Token
```http
POST /api/auth/token/refresh
Authorization: Bearer <access-token>
```

#### Logout
```http
POST /api/auth/token/logout
Authorization: Bearer <access-token>
```

### Escrow Endpoints

#### Create Escrow
```http
POST /api/escrow/create
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "payeeId": "user-uuid-here",
  "amount": 10000,  // Amount in cents ($100.00)
  "releaseCondition": "manual",  // "manual", "auto_after_date", or "milestone"
  "expiresAt": "2024-12-31T23:59:59.000Z"  // Optional
}
```

#### Get Escrow by ID
```http
GET /api/escrow/:escrowId
Authorization: Bearer <access-token>
```

#### Get User's Escrows
```http
GET /api/escrow/
Authorization: Bearer <access-token>
```

#### Fund Escrow
```http
PATCH /api/escrow/:id/fund
Authorization: Bearer <access-token>
```

## 🗄️ Database Schema

### Users Table
```sql
users {
  id: UUID (Primary Key)
  name: VARCHAR(255) NOT NULL
  email: VARCHAR(255) UNIQUE NOT NULL
  password: VARCHAR NOT NULL
  role: ENUM('payer', 'payee') DEFAULT 'payee'
  created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}
```

### Escrow Table
```sql
escrow {
  id: UUID (Primary Key)
  amount_cents: BIGINT NOT NULL
  status: ENUM('created', 'funded', 'released', 'disputed', 'cancelled', 'expired') DEFAULT 'created'
  release_condition: ENUM('manual', 'auto_after_date', 'milestone') DEFAULT 'manual'
  expires_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}
```

### Escrow Parties Table
```sql
escrow_parties {
  id: UUID (Primary Key)
  escrow_id: UUID (Foreign Key to escrow)
  payer_id: UUID (Foreign Key to users)
  payee_id: UUID (Foreign Key to users)
  created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}
```

### Transactions Table
```sql
transactions {
  id: UUID (Primary Key)
  escrow_id: UUID (Foreign Key to escrow)
  amount_cents: BIGINT NOT NULL
  type: ENUM('funding', 'release', 'refund') NOT NULL
  created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}
```

## 🔄 Escrow Status Workflow

```
created → funded → released
    ↓        ↓        ↓
cancelled disputed expired
```

### Status Descriptions
- **created**: Escrow is created but not yet funded
- **funded**: Payer has deposited funds into escrow
- **released**: Funds have been released to payee
- **disputed**: Escrow is under dispute
- **cancelled**: Escrow was cancelled before funding
- **expired**: Escrow expired without release

## 👥 User Roles

### Payer
- Creates escrow transactions
- Funds escrows
- Can release funds (manual condition)
- Can cancel uncancelled escrows

### Payee
- Receives notifications for escrow creation
- Can view escrows where they are the payee
- Receives funds when escrow is released

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Long-lived tokens for session persistence
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Authorization**: Users can only access appropriate endpoints
- **CORS Configuration**: Cross-origin requests properly configured
- **Input Validation**: Request validation on all endpoints

## 📝 Available Scripts

```bash
# Development
pnpm run dev        # Start development server with nodemon
pnpm run build      # Compile TypeScript to JavaScript
pnpm run start      # Start production server

# Database
pnpm run generate   # Generate Drizzle migrations
pnpm run push       # Push schema changes to database
```

## 🏗️ Project Structure

```
src/
├── config/
│   ├── db.ts           # Database connection
│   ├── index.ts        # Configuration management
│   └── swagger.ts      # Swagger documentation setup
├── controllers/
│   ├── auth.controller.ts
│   ├── escrow.controller.ts
│   └── user.controller.ts
├── drizzle/
│   ├── migrations/     # Database migration files
│   └── schema/         # Database schema definitions
├── middleware/
│   ├── auth.middleware.ts    # JWT authentication
│   └── error.middleware.ts    # Error handling
├── routes/
│   ├── auth.routes.ts
│   └── escrow.route.ts
├── services/
│   ├── auth.service.ts
│   └── escrow.service.ts
├── types/
│   ├── auth.ts
│   └── user.ts
├── utils/
│   ├── AppError.ts
│   └── jwt.ts
└── index.ts             # Application entry point
```

## 🔧 Development Workflow

1. **Making Changes**: Modify code in the `src/` directory
2. **Database Changes**: Update schema in `src/drizzle/schema/`, then run `pnpm run generate` and `pnpm run push`
3. **API Changes**: Update controllers, routes, and add Swagger documentation
4. **Testing**: Test endpoints using Swagger UI at `/api-docs`

## 📄 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (e.g., 3000) |
| `PG_URL` | Yes | PostgreSQL connection string |
| `SECRET` | Yes | JWT signing secret key |

### Database Configuration
The application uses PostgreSQL with Drizzle ORM. Make sure your PostgreSQL server is running and accessible via the connection string in `PG_URL`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing code conventions
- Add proper error handling
- Update Swagger documentation for new endpoints
- Write meaningful commit messages

## 📝 License

[Add your license here]

## 📞 Support

For support, please open an issue in the repository or contact [your-email@example.com].