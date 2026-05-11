import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { materialAPI } from "../utils/api";

const MaterialList = ({ materials, userRole, onMaterialDeleted }) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  const handleDelete = async (materialId) => {
    setDeleting(materialId);
    setError("");
    try {
      await materialAPI.delete(materialId);
      onMaterialDeleted?.(materialId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete material");
    } finally {
      setDeleting(null);
    }
  };

  if (materials.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 px-6 py-12 text-center">
        <p className="text-slate-500">
          {userRole === "Teacher" 
            ? "No materials uploaded yet. Upload your first course material!"
            : "No materials available yet. Check back later!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => (
        <div
          key={material._id}
          className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-6 py-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">
              {material.fileType === "application/pdf" || material.fileType === "PDF" ? "📄" : "📊"}
            </span>
            <div>
              <h3 className="font-medium text-slate-800">{material.fileName}</h3>
              <p className="text-xs text-slate-500">
                Course: {material.course?.courseCode || material.course || "N/A"} • 
                Status: <span className={`font-medium ${
                  material.status === "Ready" ? "text-green-600" : 
                  material.status === "Processing" ? "text-yellow-600" : 
                  "text-slate-600"
                }`}>{material.status || "Pending"}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {material.status === "Ready" && userRole === "Student" && (
              <button
                onClick={() => navigate(`/chat/${material._id}`)}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                Start Chat
              </button>
            )}
            
            {userRole === "Teacher" && (
              <>
                <button
                  onClick={() => handleDelete(material._id)}
                  disabled={deleting === material._id}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-70"
                >
                  {deleting === material._id ? "Deleting..." : "Delete"}
                </button>
                <span className="text-xs text-slate-400">
                  Uploaded {new Date(material.createdAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>
      ))}      {error && (
        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}    </div>
  );
};

export default MaterialList;
