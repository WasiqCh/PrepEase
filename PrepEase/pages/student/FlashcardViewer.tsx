import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardSet {
  _id: string;
  flashcards: Flashcard[];
  count: number;
  createdAt: string;
  materialId: {
    _id: string;
    title: string;
    fileName: string;
  };
}

const FlashcardViewer: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [currentCard, setCurrentCard] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/enrollments/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (err: any) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses');
    }
  };

  const handleCourseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedSet(null);
    
    if (!courseId) {
      setFlashcardSets([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/flashcards/course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setFlashcardSets(response.data.flashcardSets);
    } catch (err: any) {
      console.error('Failed to fetch flashcards:', err);
      setError('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleSetSelect = (set: FlashcardSet) => {
    setSelectedSet(set);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (selectedSet && currentCard < selectedSet.flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const resetStudy = () => {
    setCurrentCard(0);
    setIsFlipped(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Study with Flashcards</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Course Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium mb-2">Select Course</label>
        <select
          value={selectedCourse}
          onChange={handleCourseChange}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Select a course --</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Flashcard Sets List */}
      {flashcardSets.length > 0 && !selectedSet && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Flashcard Sets</h2>
          
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcardSets.map((set) => (
                <div
                  key={set._id}
                  onClick={() => handleSetSelect(set)}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition"
                >
                  <h3 className="font-medium text-lg">{set.materialId.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {set.count} flashcards
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Created {new Date(set.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flashcard Study Interface */}
      {selectedSet && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {selectedSet.materialId.title}
            </h2>
            <button
              onClick={() => setSelectedSet(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Sets
            </button>
          </div>

          <div className="flex flex-col items-center">
            {/* Flashcard */}
            <div 
              className="w-full max-w-2xl h-80 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg cursor-pointer flex items-center justify-center p-8 text-white text-center transition-transform transform hover:scale-105"
              onClick={flipCard}
            >
              <div className="text-xl">
                {isFlipped 
                  ? selectedSet.flashcards[currentCard].back 
                  : selectedSet.flashcards[currentCard].front
                }
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6 text-center">
              <p className="text-lg font-medium">
                Card {currentCard + 1} of {selectedSet.flashcards.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Click card to flip
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${((currentCard + 1) / selectedSet.flashcards.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={prevCard}
                disabled={currentCard === 0}
                className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              <button
                onClick={resetStudy}
                className="bg-yellow-500 text-white py-2 px-6 rounded-lg hover:bg-yellow-600"
              >
                Start Over
              </button>
              
              <button
                onClick={nextCard}
                disabled={currentCard === selectedSet.flashcards.length - 1}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            {/* Completion Message */}
            {currentCard === selectedSet.flashcards.length - 1 && (
              <div className="mt-6 text-center">
                <p className="text-green-600 font-semibold">
                  🎉 You've reached the last card!
                </p>
                <button
                  onClick={resetStudy}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Start over to review
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedCourse && flashcardSets.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            No flashcards available for this course yet.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Your teacher can create flashcards from course materials.
          </p>
        </div>
      )}
    </div>
  );
};

export default FlashcardViewer;
