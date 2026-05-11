import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const MaterialUpload = ({ onSuccess }) => {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/courses");
      setCourses(response.data.courses || []);
      setMessage({ type: "", text: "" });
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Failed to load courses";
      setMessage({ type: "error", text: errorMsg });
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setMessage({ type: "error", text: "Please select a PDF file" });
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
      setMessage({ type: "", text: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }

    if (!courseId) {
      setMessage({ type: "error", text: "Please select a course" });
      return;
    }

    if (!file) {
      setMessage({ type: "error", text: "Please select a PDF file" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("courseId", courseId);
    formData.append("file", file);

    try {
      await axiosInstance.post("/materials/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({ type: "success", text: "Material uploaded successfully!" });
      setTitle("");
      setCourseId("");
      setFile(null);
      document.getElementById("file-input").value = "";
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Upload failed. Please try again.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Material</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
            Course
          </label>
          {loading ? (
            <div className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
              Loading courses...
            </div>
          ) : courses.length > 0 ? (
            <select
              id="course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={uploading}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode ? `${course.courseCode} - ` : ""}{course.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full px-4 py-2 border border-red-300 rounded-md bg-red-50 text-red-700 text-sm">
              No courses available. Please create a course first.
              <button
                type="button"
                onClick={fetchCourses}
                className="ml-2 text-red-900 font-semibold hover:underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter material title"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={uploading || loading}
          />
        </div>

        <div>
          <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
            PDF File
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading || loading}
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        {message.text && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || loading || courses.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "Uploading..." : loading ? "Loading..." : "Upload Material"}
        </button>
      </form>
    </div>
  );
};

export default MaterialUpload;
