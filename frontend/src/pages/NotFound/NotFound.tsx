import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10 max-w-lg w-full space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div>
          <span className="text-4xl font-extrabold text-indigo-600 tracking-tight font-mono block mb-1">
            404
          </span>
          <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
            The route or resource you are looking for doesn't exist or has been relocated within the Delivery CRM.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/dashboard">
            <Button
              variant="primary"
              size="md"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
