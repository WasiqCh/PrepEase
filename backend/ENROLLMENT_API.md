# Student Enrollment System - API Documentation

## Overview
This document describes the Student Enrollment system implementation for PrepEase. The system ensures that students can only access course materials, quizzes, and chat features for courses they are enrolled in.

---

## Database Model

### StudentEnrollment
```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),     // Student ID
  course: ObjectId (ref: Course),    // Course ID
  enrolledAt: Date,                  // Enrollment timestamp
  createdAt: Date,                   // Record creation time
  updatedAt: Date,                   // Record update time
}
```

**Unique Constraint**: `{student: 1, course: 1}` - Prevents duplicate enrollments

---

## API Endpoints

### 1. Enroll in a Course
**Endpoint:** `POST /api/enrollments/enroll`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "courseId": "mongodb_course_id"
}
```

**Response (201 - Created):**
```json
{
  "message": "Successfully enrolled in course.",
  "enrollment": {
    "_id": "enrollment_id",
    "student": "student_id",
    "course": {
      "_id": "course_id",
      "courseCode": "CS101",
      "title": "Introduction to Computer Science",
      "teacher": "teacher_id"
    },
    "enrolledAt": "2026-01-30T10:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Missing courseId
- `403` - Only students can enroll (Teacher/Admin attempted)
- `404` - Course not found
- `409` - Already enrolled in course
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:5001/api/enrollments/enroll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "507f1f77bcf86cd799439011"}'
```

---

### 2. Unenroll from a Course
**Endpoint:** `DELETE /api/enrollments/:courseId`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `courseId` (string) - MongoDB course ID

**Response (200 - OK):**
```json
{
  "message": "Successfully unenrolled from course."
}
```

**Error Responses:**
- `403` - Only students can unenroll
- `404` - Not enrolled in course
- `500` - Server error

**Example:**
```bash
curl -X DELETE http://localhost:5001/api/enrollments/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get My Enrollments
**Endpoint:** `GET /api/enrollments/my-courses`

**Authentication:** Required (Bearer token)

**Query Parameters:** None

**Response (200 - OK):**
```json
{
  "message": "Enrollments retrieved successfully.",
  "enrollments": [
    {
      "_id": "enrollment_id",
      "student": "student_id",
      "course": {
        "_id": "course_id",
        "courseCode": "CS101",
        "title": "Introduction to Computer Science",
        "teacher": "teacher_id",
        "createdAt": "2026-01-01T00:00:00Z"
      },
      "enrolledAt": "2026-01-30T10:00:00Z"
    }
  ],
  "count": 3
}
```

**Error Responses:**
- `403` - Only students can view their enrollments
- `500` - Server error

**Example:**
```bash
curl -X GET http://localhost:5001/api/enrollments/my-courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Get Course Enrollments (Teacher Only)
**Endpoint:** `GET /api/enrollments/course/:courseId`

**Authentication:** Required (Bearer token - Teacher of the course)

**URL Parameters:**
- `courseId` (string) - MongoDB course ID

**Response (200 - OK):**
```json
{
  "message": "Course enrollments retrieved successfully.",
  "enrollments": [
    {
      "_id": "enrollment_id",
      "student": {
        "_id": "student_id",
        "email": "student@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "name": "John Doe"
      },
      "course": "course_id",
      "enrolledAt": "2026-01-30T10:00:00Z"
    }
  ],
  "count": 25
}
```

**Error Responses:**
- `403` - Not the course teacher
- `404` - Course not found
- `500` - Server error

**Example:**
```bash
curl -X GET http://localhost:5001/api/enrollments/course/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Protected Resources

The following endpoints now require proper enrollment/ownership:

### Materials Access
- **Endpoint:** `GET /api/materials/:courseId`
- **Student Rule:** Must be enrolled in course
- **Teacher Rule:** Must own the course

### Chat (Study Buddy)
- **Endpoint:** `POST /api/chat`
- **Student Rule:** Must be enrolled in course that owns the material
- **Teacher Rule:** Must own the course that owns the material

### Quizzes
- **Endpoint:** `GET /api/quizzes/material/:materialId`
- **Student Rule:** Must be enrolled in course that owns the material
- **Teacher Rule:** Must own the course that owns the material

---

## Authorization Rules

### Student Role
✅ Can:
- Enroll in courses
- Unenroll from courses
- View their enrollments
- Access materials from enrolled courses
- Ask questions about materials in enrolled courses
- Take quizzes from enrolled courses

❌ Cannot:
- Enroll other students
- View other students' enrollments
- Access materials from non-enrolled courses
- Create quizzes
- Delete materials

### Teacher Role
✅ Can:
- Create courses
- Upload materials to their courses
- Generate quizzes
- View students enrolled in their courses
- Access their own course materials

❌ Can:
- Enroll as a student
- Access other teachers' courses
- Enroll students directly (only students self-enroll)

### Admin Role
✅ Can:
- View all materials across all courses
- View enrollment data
- Manage users and courses
- View system health

---

## Error Handling

### Common Error Responses

**400 - Bad Request**
```json
{
  "message": "courseId is required."
}
```

**403 - Forbidden**
```json
{
  "message": "Only students can enroll in courses."
}
```

**404 - Not Found**
```json
{
  "message": "Course not found."
}
```

**409 - Conflict**
```json
{
  "message": "You are already enrolled in this course."
}
```

**500 - Internal Server Error**
```json
{
  "message": "Failed to enroll in course.",
  "error": "Database connection error"
}
```

---

## Implementation Details

### Database Indexes
The StudentEnrollment collection has:
- **Unique Index**: `{student: 1, course: 1}` - Ensures no duplicate enrollments
- **Index**: `{student: 1}` - For querying student's enrollments
- **Index**: `{course: 1}` - For querying course's students

### Transaction Safety
Enrollment operations are atomic and safe for concurrent requests.

### Performance Considerations
- Enrollment checks are fast O(1) database lookups
- Filtered material/quiz queries use course IDs from enrollments
- No N+1 queries; all lookups use proper indexing

---

## Migration from Old System

### Old Behavior
- ✅ Teachers could access their course materials
- ❌ Students could access ALL materials (security issue)
- ❌ No enrollment model existed

### New Behavior
- ✅ Teachers can access their course materials
- ✅ Students can only access enrolled course materials
- ✅ StudentEnrollment model tracks enrollments
- ✅ Duplicate enrollments prevented

### Breaking Changes
- Students accessing non-enrolled courses will now get 403 error
- New `enrollments` endpoint required for student setup

---

## Testing

### Test Scenarios

**1. Student Enrollment**
```bash
# Enroll in course
POST /api/enrollments/enroll
Body: {"courseId": "507f1f77bcf86cd799439011"}
Expected: 201 Created

# Enroll again (should fail)
POST /api/enrollments/enroll
Body: {"courseId": "507f1f77bcf86cd799439011"}
Expected: 409 Conflict
```

**2. Material Access**
```bash
# Access enrolled course materials
GET /api/materials/507f1f77bcf86cd799439011
Expected: 200 OK, list of materials

# Access non-enrolled course materials
GET /api/materials/507f1f77bcf86cd799439099
Expected: 403 Forbidden
```

**3. Teacher Access**
```bash
# Teacher accesses own course
GET /api/materials/507f1f77bcf86cd799439011
Expected: 200 OK

# Teacher accesses another teacher's course
GET /api/materials/507f1f77bcf86cd799439099
Expected: 403 Forbidden
```

---

## Frontend Integration

### Example: Enroll Button
```javascript
const handleEnroll = async (courseId) => {
  try {
    const response = await axios.post(
      'http://localhost:5001/api/enrollments/enroll',
      { courseId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    console.log('Enrolled:', response.data);
    // Refresh enrolled courses list
  } catch (error) {
    alert(error.response?.data?.message || 'Enrollment failed');
  }
};
```

### Example: Get My Courses
```javascript
useEffect(() => {
  const fetchMyEnrollments = async () => {
    try {
      const { data } = await axios.get(
        'http://localhost:5001/api/enrollments/my-courses',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setEnrolledCourses(data.enrollments);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    }
  };
  fetchMyEnrollments();
}, []);
```

---

## Rollback Plan

If issues arise, the system can be rolled back:

1. Remove enrollment checks from controllers
2. Drop StudentEnrollment collection (if needed)
3. Restart API server
4. Students will regain access to all materials

However, this is not recommended for production systems.

---

## Future Enhancements

1. **Waitlist**: Students can join waitlist if course is full
2. **Batch Enrollment**: Teachers can enroll students in bulk
3. **Enrollment Status**: Track approval/rejection
4. **Audit Trail**: Log all enrollment changes
5. **Analytics**: Track enrollment trends
6. **Notifications**: Email on enrollment status changes

---

## Support

For issues or questions:
1. Check error message returned by API
2. Verify JWT token is valid
3. Verify student/teacher role in User model
4. Check StudentEnrollment collection in MongoDB
5. Review server logs for detailed errors

