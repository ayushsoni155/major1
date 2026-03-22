# API Test Results\n\n## Service: Auth Service\n### POST /auth/register\n**Input**:\n```json\n{
  "email": "testuser_1774114099601@example.com",
  "password": "Password@123",
  "name": "Full Test User"
}\n```\n**Status**: 201\n**Output**:\n```json\n{
  "status": 201,
  "data": {
    "email": "testuser_1774114099601@example.com"
  },
  "message": "Account created! Please check your email for the verification code."
}\n```\n---\n### POST /auth/verify-otp\n**Input**:\n```json\n{
  "email": "testuser_1774114099601@example.com",
  "otp": "247972"
}\n```\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": {
    "user": {
      "id": "936a5ee0-fc76-41f5-ba07-562ee499aab7",
      "email": "testuser_1774114099601@example.com",
      "name": "Full Test User",
      "role": "user"
    }
  },
  "message": "Email verified successfully! Welcome to RapidBase."
}\n```\n---\n### POST /auth/login\n**Input**:\n```json\n{
  "email": "testuser_1774114099601@example.com",
  "password": "Password@123"
}\n```\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": {
    "user": {
      "id": "936a5ee0-fc76-41f5-ba07-562ee499aab7",
      "email": "testuser_1774114099601@example.com",
      "name": "Full Test User",
      "role": "user"
    }
  },
  "message": "Login successful"
}\n```\n---\n### GET /auth/me\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": {
    "id": "936a5ee0-fc76-41f5-ba07-562ee499aab7",
    "email": "testuser_1774114099601@example.com",
    "name": "Full Test User",
    "role": "user",
    "avatar_url": null,
    "is_active": true,
    "last_login": "2026-03-21T17:28:26.512Z",
    "created_at": "2026-03-21T17:28:20.221Z"
  },
  "message": "User profile retrieved"
}\n```\n---\n\n## Service: Project Service\n### POST /projects/\n**Input**:\n```json\n{
  "name": "Full API Test Project",
  "description": "Testing all routes"
}\n```\n**Status**: 201\n**Output**:\n```json\n{
  "status": 201,
  "data": {
    "project_id": "bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac",
    "owner_id": "936a5ee0-fc76-41f5-ba07-562ee499aab7",
    "project_name": "Full API Test Project",
    "project_description": "Testing all routes",
    "schema_name": "proj_7ss9qgom",
    "project_status": "active",
    "created_at": "2026-03-21T17:28:26.590Z",
    "updated_at": "2026-03-21T17:28:26.590Z"
  },
  "message": "Project created successfully"
}\n```\n---\n### GET /projects/\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": [
    {
      "project_id": "bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac",
      "owner_id": "936a5ee0-fc76-41f5-ba07-562ee499aab7",
      "project_name": "Full API Test Project",
      "project_description": "Testing all routes",
      "schema_name": "proj_7ss9qgom",
      "project_status": "active",
      "created_at": "2026-03-21T17:28:26.590Z",
      "updated_at": "2026-03-21T17:28:26.590Z",
      "role": "admin"
    }
  ],
  "message": "Projects retrieved successfully"
}\n```\n---\n### GET /projects/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": {
    "project_id": "bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac",
    "owner_id": "936a5ee0-fc76-41f5-ba07-562ee499aab7",
    "project_name": "Full API Test Project",
    "project_description": "Testing all routes",
    "schema_name": "proj_7ss9qgom",
    "project_status": "active",
    "created_at": "2026-03-21T17:28:26.590Z",
    "updated_at": "2026-03-21T17:28:26.590Z",
    "role": "admin"
  },
  "message": "Project details retrieved"
}\n```\n---\n### PATCH /projects/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac\n**Input**:\n```json\n{
  "description": "Updated description"
}\n```\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": {
    "project_id": "bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac",
    "owner_id": "936a5ee0-fc76-41f5-ba07-562ee499aab7",
    "project_name": "Full API Test Project",
    "project_description": "Updated description",
    "schema_name": "proj_7ss9qgom",
    "project_status": "active",
    "created_at": "2026-03-21T17:28:26.590Z",
    "updated_at": "2026-03-21T17:28:26.701Z"
  },
  "message": "Project updated"
}\n```\n---\n\n### Sub-Service: Schema & Tables\n### GET /schema/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": {
    "nodes": [],
    "edges": [],
    "schemaName": "proj_7ss9qgom"
  },
  "message": "Schema visualized"
}\n```\n---\n### POST /projects/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac/tables\n**Input**:\n```json\n{
  "tableName": "test_employees",
  "columns": [
    {
      "name": "emp_name",
      "type": "text"
    },
    {
      "name": "age",
      "type": "numeric"
    }
  ]
}\n```\n**Status**: 400\n**Output**:\n```json\n{
  "status": 400,
  "data": null,
  "message": "Missing data type for column: emp_name"
}\n```\n---\n### GET /projects/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac/tables\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": [],
  "message": "Tables retrieved."
}\n```\n---\n### POST /projects/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac/keys\n**Input**:\n```json\n{
  "name": "Test Key"
}\n```\n**Status**: 400\n**Output**:\n```json\n{
  "status": 400,
  "data": null,
  "message": "Key name is required."
}\n```\n---\n### GET /projects/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac/keys\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": [],
  "message": "API keys retrieved."
}\n```\n---\n\n### Sub-Service: Members\n### GET /projects/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac/members\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": [
    {
      "id": "e7f25d87-3f7d-4f32-aa20-c61d949625aa",
      "user_id": "936a5ee0-fc76-41f5-ba07-562ee499aab7",
      "role": "admin",
      "invited_at": "2026-03-21T17:28:26.590Z",
      "email": "testuser_1774114099601@example.com",
      "name": "Full Test User",
      "avatar_url": null
    }
  ],
  "message": "Members retrieved."
}\n```\n---\n### DELETE /projects/bbb4e621-df74-4ef9-bcd4-ffc5b8f341ac\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": null,
  "message": "Project deleted"
}\n```\n---\n\n## Auth - Logout\n### POST /auth/logout\n**Input**: None\n**Status**: 200\n**Output**:\n```json\n{
  "status": 200,
  "data": null,
  "message": "Logged out successfully"
}\n```\n---\n