# Library Management System API Documentation

## Overview

This Next.js application provides a comprehensive library management system with full CRUD operations for books, authors, members, categories, and borrowings.

## Models

### 1. Book
- **Fields**: title, author, authorId, isbn, categories, status, description, publishedDate, publisher, pages, language, edition, location, coverImage, rating, totalCopies, availableCopies, price, condition
- **Status**: Available, Borrowed, Maintenance, Reserved
- **Relationships**: belongs to Author, has many Categories

### 2. Author
- **Fields**: firstName, lastName, email, biography, birthDate, nationality, website, socialMedia, isActive
- **Relationships**: has many Books

### 3. Member
- **Fields**: firstName, lastName, email, phone, address, membershipType, membershipStatus, joinDate, expiryDate, maxBooksAllowed, currentBooksCount, fines, notes
- **Types**: Basic, Premium, Student, Senior
- **Status**: Active, Suspended, Expired, Pending
- **Relationships**: has many Borrowings

### 4. Category
- **Fields**: name, description, parentCategory, isActive, sortOrder, color, icon
- **Features**: Hierarchical structure, tree view support
- **Relationships**: has many Books, may have parent Category

### 5. Borrowing
- **Fields**: book, member, borrowDate, dueDate, returnDate, status, renewalCount, maxRenewals, fineAmount, notes, librarian
- **Status**: Active, Returned, Overdue, Lost
- **Features**: Auto-calculate fines, renewal limits, overdue detection

## API Endpoints

### Books
- `GET /api/books` - List all books (with pagination, search, filters)
- `POST /api/books` - Create new book
- `GET /api/books/[id]` - Get book by ID
- `PUT /api/books/[id]` - Update book
- `DELETE /api/books/[id]` - Delete book

### Authors
- `GET /api/authors` - List all authors (with pagination, search)
- `POST /api/authors` - Create new author
- `GET /api/authors/[id]` - Get author by ID (include books with ?includeBooks=true)
- `PUT /api/authors/[id]` - Update author
- `DELETE /api/authors/[id]` - Soft delete author

### Members
- `GET /api/members` - List all members (with pagination, search, filters)
- `POST /api/members` - Create new member
- `GET /api/members/[id]` - Get member by ID (include borrowings with ?includeBorrowings=true)
- `PUT /api/members/[id]` - Update member
- `DELETE /api/members/[id]` - Delete member (if no active borrowings)

### Categories
- `GET /api/categories` - List all categories
  - `?tree=true` - Get hierarchical tree structure
  - `?parentOnly=true` - Get only parent categories
- `POST /api/categories` - Create new category
- `GET /api/categories/[id]` - Get category by ID
  - `?includeSubcategories=true` - Include subcategories
  - `?includeBooks=true` - Include books in this category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Soft delete category

### Borrowings
- `GET /api/borrowings` - List all borrowings (with pagination, search, filters)
  - `?status=Active` - Filter by status
  - `?memberId=[id]` - Filter by member
  - `?bookId=[id]` - Filter by book
  - `?overdue=true` - Get only overdue borrowings
- `POST /api/borrowings` - Create new borrowing (borrow a book)
- `GET /api/borrowings/[id]` - Get borrowing by ID
- `PUT /api/borrowings/[id]` - Update borrowing
- `DELETE /api/borrowings/[id]` - Delete borrowing (only if returned)

### Borrowing Operations
- `POST /api/borrowings/return` - Return a book
- `POST /api/borrowings/renew` - Renew a borrowing

### Dashboard
- `GET /api/dashboard/stats` - Get comprehensive dashboard statistics

### Search
- `GET /api/search?q=[query]&type=[all|books|authors|members|categories]` - Global search

## Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Sorting
- `sortBy` - Field to sort by
- `sortOrder` - 1 for ascending, -1 for descending

### Search
- `search` - Search term for text fields

## Example API Calls

### Create a new book
```javascript
POST /api/books
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0-7432-7356-5",
  "categories": ["60f1234567890abcdef12345"],
  "description": "A classic American novel",
  "publishedDate": "1925-04-10",
  "publisher": "Scribner",
  "pages": 180,
  "totalCopies": 3,
  "availableCopies": 3
}
```

### Borrow a book
```javascript
POST /api/borrowings
{
  "bookId": "60f1234567890abcdef12345",
  "memberId": "60f1234567890abcdef67890",
  "librarian": "John Doe"
}
```

### Return a book
```javascript
POST /api/borrowings/return
{
  "borrowingId": "60f1234567890abcdef11111",
  "librarian": "John Doe"
}
```

### Search across all entities
```javascript
GET /api/search?q=gatsby&type=all
```

## Error Handling

All APIs return consistent error responses:
```javascript
{
  "success": false,
  "error": "Error message description"
}
```

## Success Responses

All APIs return consistent success responses:
```javascript
{
  "success": true,
  "data": { /* response data */ },
  "pagination": { /* pagination info for lists */ }
}
```

## Features

### Automatic Business Logic
- **Book Availability**: Automatically updates when borrowed/returned
- **Member Limits**: Enforces borrowing limits based on membership type
- **Fine Calculation**: Auto-calculates overdue fines
- **Renewal Limits**: Enforces maximum renewal restrictions
- **Validation**: Comprehensive validation for all operations

### Advanced Queries
- **Population**: Related data is automatically populated in responses
- **Filtering**: Multiple filter options for each endpoint
- **Search**: Full-text search across relevant fields
- **Sorting**: Flexible sorting options
- **Pagination**: Efficient pagination for large datasets

### Data Integrity
- **Referential Integrity**: Prevents deletion of referenced entities
- **Soft Deletes**: Authors and categories use soft deletes
- **Unique Constraints**: Email uniqueness for authors/members, ISBN for books
- **Status Management**: Automatic status updates based on business rules

## Environment Setup

Make sure to set up your MongoDB connection in `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/library?retryWrites=true&w=majority
```

## Getting Started

1. Install dependencies: `pnpm install`
2. Set up environment variables in `.env.local`
3. Start development server: `pnpm run dev`
4. Access API at `http://localhost:3001/api/`

## Database Collections

The system uses the following MongoDB collections:
- `books` - Book records
- `authors` - Author information
- `members` - Library member accounts
- `categories` - Book categories with hierarchy
- `borrowings` - Borrowing transactions

All collections include `createdAt` and `updatedAt` timestamps automatically.