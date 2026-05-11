# Student Enrollment System - Integration Guide

## Quick Start for Frontend Integration

### 1. Basic Enrollment Flow

```javascript
// enrollmentService.js
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

export const enrollmentService = {
  // Enroll student in course
  enrollCourse: async (courseId) => {
    const response = await axios.post(
      `${API_BASE}/enrollments/enroll`,
      { courseId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  // Unenroll student from course
  unenrollCourse: async (courseId) => {
    const response = await axios.delete(
      `${API_BASE}/enrollments/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  },

  // Get all enrolled courses for current student
  getMyEnrollments: async () => {
    const response = await axios.get(
      `${API_BASE}/enrollments/my-courses`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data.enrollments;
  },

  // Get all students in a course (teacher only)
  getCourseEnrollments: async (courseId) => {
    const response = await axios.get(
      `${API_BASE}/enrollments/course/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data.enrollments;
  }
};
```

---

### 2. Course Discovery Component (for students)

```typescript
// StudentCourseDiscovery.tsx
import { useState, useEffect } from 'react';
import { enrollmentService } from '../services/enrollmentService';

interface Course {
  _id: string;
  courseCode: string;
  title: string;
  teacher: { _id: string; email: string };
}

export const StudentCourseDiscovery = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all courses
        const coursesRes = await axios.get(`${API_BASE}/courses`);
        setCourses(coursesRes.data.courses);

        // Fetch enrolled courses
        const enrollmentsRes = await enrollmentService.getMyEnrollments();
        const enrolledIds = new Set(
          enrollmentsRes.map((e) => e.course._id)
        );
        setEnrolledCourseIds(enrolledIds);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await enrollmentService.enrollCourse(courseId);
      setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
      alert('Successfully enrolled!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to unenroll?')) return;

    setEnrollingId(courseId);
    try {
      await enrollmentService.unenrollCourse(courseId);
      setEnrolledCourseIds((prev) => {
        const updated = new Set(prev);
        updated.delete(courseId);
        return updated;
      });
      alert('Successfully unenrolled!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Unenrollment failed');
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) return <div>Loading courses...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Available Courses</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div 
            key={course._id} 
            className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold mb-2">{course.title}</h3>
            <p className="text-gray-600 text-sm mb-4">Code: {course.courseCode}</p>
            
            {enrolledCourseIds.has(course._id) ? (
              <>
                <button
                  onClick={() => handleUnenroll(course._id)}
                  disabled={enrollingId === course._id}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {enrollingId === course._id ? 'Unenrolling...' : 'Unenroll'}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleEnroll(course._id)}
                disabled={enrollingId === course._id}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {enrollingId === course._id ? 'Enrolling...' : 'Enroll'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 3. My Courses Component (for enrolled students)

```typescript
// StudentMyCourses.tsx
import { useState, useEffect } from 'react';
import { enrollmentService } from '../services/enrollmentService';

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    courseCode: string;
    title: string;
    teacher: { _id: string; email: string };
  };
  enrolledAt: string;
}

export const StudentMyCourses = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const enrollments = await enrollmentService.getMyEnrollments();
        setEnrollments(enrollments);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load enrollments');
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, []);

  if (loading) return <div>Loading your courses...</div>;

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
        <a href="/student/discover-courses" className="text-blue-600 hover:underline">
          Browse available courses
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Courses ({enrollments.length})</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {enrollments.map((enrollment) => (
          <div 
            key={enrollment._id}
            className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
          >
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              {enrollment.course.title}
            </h3>
            
            <div className="text-sm text-blue-800 space-y-1 mb-4">
              <p><strong>Code:</strong> {enrollment.course.courseCode}</p>
              <p><strong>Teacher:</strong> {enrollment.course.teacher.email}</p>
              <p><strong>Enrolled:</strong> {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
            </div>

            <div className="space-x-2">
              <a 
                href={`/student/course/${enrollment.course._id}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Course
              </a>
              <a 
                href={`/student/course/${enrollment.course._id}/materials`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Materials
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 4. Teacher's Student Roster

```typescript
// TeacherStudentRoster.tsx
import { useState, useEffect } from 'react';
import { enrollmentService } from '../services/enrollmentService';

interface StudentEnrollment {
  _id: string;
  student: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  enrolledAt: string;
}

export const TeacherStudentRoster = ({ courseId }: { courseId: string }) => {
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const enrollments = await enrollmentService.getCourseEnrollments(courseId);
        setStudents(enrollments);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load enrollments');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [courseId]);

  if (loading) return <div>Loading student roster...</div>;

  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        Enrolled Students ({students.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-3 text-left">Email</th>
              <th className="border p-3 text-left">Name</th>
              <th className="border p-3 text-left">Enrolled Date</th>
            </tr>
          </thead>
          <tbody>
            {students.map((enrollment) => (
              <tr key={enrollment._id} className="hover:bg-gray-50">
                <td className="border p-3">{enrollment.student.email}</td>
                <td className="border p-3">
                  {enrollment.student.firstName} {enrollment.student.lastName}
                </td>
                <td className="border p-3">
                  {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

### 5. Error Handling Pattern

```typescript
// API Call with proper error handling
const enrollAndHandleErrors = async (courseId: string) => {
  try {
    const result = await enrollmentService.enrollCourse(courseId);
    console.log('Enrollment successful:', result);
    // Update UI to show success
    return true;
  } catch (error: any) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.message;

    switch (statusCode) {
      case 400:
        alert('Invalid request: ' + message);
        break;
      case 403:
        alert('Permission denied: Only students can enroll');
        break;
      case 404:
        alert('Course not found');
        break;
      case 409:
        alert('You are already enrolled in this course');
        break;
      case 500:
        alert('Server error: Please try again later');
        break;
      default:
        alert('Enrollment failed: ' + message);
    }
    return false;
  }
};
```

---

### 6. Checking Enrollment Before Access

```typescript
// ProtectedCourseRoute.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { enrollmentService } from '../services/enrollmentService';

export const ProtectedCourseRoute = ({ children }: { children: React.ReactNode }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const enrollments = await enrollmentService.getMyEnrollments();
        const isEnrolled = enrollments.some((e) => e.course._id === courseId);
        
        if (isEnrolled) {
          setHasAccess(true);
        } else {
          setError('You are not enrolled in this course');
          setHasAccess(false);
        }
      } catch (err) {
        setError('Failed to check enrollment');
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [courseId]);

  if (hasAccess === null) {
    return <div>Checking access...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="p-6 bg-red-50 border border-red-300 rounded-lg">
        <h2 className="text-lg font-bold text-red-900 mb-2">Access Denied</h2>
        <p className="text-red-800 mb-4">{error}</p>
        <a 
          href="/student/discover-courses"
          className="text-blue-600 hover:underline"
        >
          Enroll in this course
        </a>
      </div>
    );
  }

  return <>{children}</>;
};
```

---

## Testing with cURL

### Enroll in Course
```bash
curl -X POST http://localhost:5001/api/enrollments/enroll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "507f1f77bcf86cd799439011"}'
```

### Get My Enrollments
```bash
curl http://localhost:5001/api/enrollments/my-courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Unenroll from Course
```bash
curl -X DELETE http://localhost:5001/api/enrollments/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Teacher: View Course Enrollments
```bash
curl http://localhost:5001/api/enrollments/course/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TEACHER_JWT_TOKEN"
```

---

## Migration Checklist

- [ ] Create StudentEnrollment model in MongoDB
- [ ] Deploy updated backend code
- [ ] Test enrollment endpoints with cURL
- [ ] Update frontend to call enrollment endpoints
- [ ] Add course discovery page
- [ ] Add my-courses page
- [ ] Test material access restrictions
- [ ] Test quiz access restrictions
- [ ] Test chat access restrictions
- [ ] Add teacher roster view
- [ ] Test with multiple students
- [ ] Performance testing with 1000+ enrollments

