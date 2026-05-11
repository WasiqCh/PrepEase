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

const FlashcardGenerator: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [count, setCount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [currentCard, setCurrentCard] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Fetch teacher's materials
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/materials/teacher/my-materials', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only AI-ready materials (those with extracted text)
      const readyMaterials = response.data.filter((m: any) => m.extractedText && m.extractedText.length > 0);
      setMaterials(readyMaterials);
    } catch (err: any) {
      console.error('Failed to fetch materials:', err);
      setError('Failed to load materials');
    }
  };

  const handleGenerate = async () => {
    if (!selectedMaterial) {
      setError('Please select a material');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/flashcards/generate',
        {
          materialId: selectedMaterial,
          count: count
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setGeneratedFlashcards(response.data.flashcards);
      setCurrentCard(0);
      setIsFlipped(false);
      setSuccess(`Successfully generated ${response.data.count} flashcards!`);
      
      // Reload flashcard sets
      fetchFlashcardsByMaterial(selectedMaterial);
    } catch (err: any) {
      console.error('Failed to generate flashcards:', err);
      setError(err.response?.data?.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashcardsByMaterial = async (materialId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/flashcards/material/${materialId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setFlashcardSets(response.data.flashcardSets);
    } catch (err: any) {
      console.error('Failed to fetch flashcard sets:', err);
    }
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialId = e.target.value;
    setSelectedMaterial(materialId);
    if (materialId) {
      fetchFlashcardsByMaterial(materialId);
    } else {
      setFlashcardSets([]);
    }
  };

  const nextCard = () => {
    if (currentCard < generatedFlashcards.length - 1) {
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

  const handleDeleteSet = async (setId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard set?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/flashcards/${setId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Flashcard set deleted successfully');
      if (selectedMaterial) {
        fetchFlashcardsByMaterial(selectedMaterial);
      }
    } catch (err: any) {
      console.error('Failed to delete flashcard set:', err);
      setError('Failed to delete flashcard set');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Flashcard Generator</h1>

      {/* Generator Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate New Flashcards</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Material</label>
            <select
              value={selectedMaterial}
              onChange={handleMaterialChange}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              <option value="">-- Select a material --</option>
              {materials.map((material) => (
                <option key={material._id} value={material._id}>
                  {material.title} ({material.fileName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Flashcards</label>
            <input
              type="number"
              min="5"
              max="50"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedMaterial}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Flashcards'}
          </button>
        </div>
      </div>

      {/* Flashcard Viewer */}
      {generatedFlashcards.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Preview Flashcards</h2>
          
          <div className="flex flex-col items-center">
            <div 
              className="w-full max-w-md h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg cursor-pointer flex items-center justify-center p-6 text-white text-center transition-transform transform hover:scale-105"
              onClick={flipCard}
            >
              <div className="text-lg">
                {isFlipped 
                  ? generatedFlashcards[currentCard].back 
                  : generatedFlashcards[currentCard].front
                }
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Card {currentCard + 1} of {generatedFlashcards.length}
              <span className="ml-2 text-gray-500">(Click card to flip)</span>
            </div>

            <div className="flex space-x-4 mt-4">
              <button
                onClick={prevCard}
                disabled={currentCard === 0}
                className="bg-gray-300 text-gray-700 py-2 px-6 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={nextCard}
                disabled={currentCard === generatedFlashcards.length - 1}
                className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Flashcard Sets */}
      {flashcardSets.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Saved Flashcard Sets</h2>
          
          <div className="space-y-4">
            {flashcardSets.map((set) => (
              <div key={set._id} className="border rounded p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{set.materialId.title}</h3>
                  <p className="text-sm text-gray-600">
                    {set.count} flashcards • Created {new Date(set.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSet(set._id)}
                  className="bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardGenerator;
