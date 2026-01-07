import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function PlantDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/plants" className="text-green-600 hover:text-green-700 text-sm font-medium">
            &larr; Back to Plants
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Plant Details</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-500">Plant detail view for ID: {id} coming soon...</p>
        </div>
      </div>
    </Layout>
  );
}
