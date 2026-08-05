import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';

export default function LinkDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <HiArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="card p-6">
        <h1 className="text-xl font-bold text-gray-900">Link Details</h1>
        <p className="text-gray-500 mt-2">Link ID: {id}</p>
        <p className="text-gray-400 mt-4">Full details coming soon...</p>
      </div>
    </div>
  );
}
