# Kebunku Admin

NestJS admin for Kebunku that organize your tree and it's category. Use EJS for template engine, Bootstrap for CSS-library, cookie sessions, and more

## Main Features

## Requirements and setup

## Database design

```mermaid
erDiagram
  CATEGORIES ||--o{ TREES : contains
  CATEGORIES {
    integer id PK
    varchar name
    varchar code UK
  }
  TREES {
    integer id PK
    varchar tree_id UK
    date planting_date
    text location
    text image_url
    integer category_id FK
  }
  ADMINS {
    integer id PK
    varchar email UK
    varchar password_hash
    varchar name
  }
```

## List API endpoints

## Dependencies and developer notes
