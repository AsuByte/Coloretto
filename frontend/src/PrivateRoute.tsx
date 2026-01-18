import { useState, useEffect } from "react";
import { useAuth } from "@/constants/data";
import { Navigate, Outlet } from "react-router-dom";
import "@/css/PrivateRoute.css";

function PrivateRoute() {
  const { loading, authenticated } = useAuth();
  const [percentage, setPercentage] = useState(0);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (percentage < 100) {
      const interval = setInterval(() => {
        const increment = Math.floor(Math.random() * 10) + 1;
        setPercentage((prev) => {
          const newValue = Math.min(prev + increment, 100);
          if (newValue === 100) {
            setTimeout(() => {
              setShowLoading(false);
            }, 0);
          }
          return newValue;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [percentage]);

  if (loading || showLoading) {
    return (
      <div className="loading-container">
        <div className="circle">
          <h1>{percentage}%</h1>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
