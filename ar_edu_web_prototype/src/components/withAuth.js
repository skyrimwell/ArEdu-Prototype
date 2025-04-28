import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate();

    useEffect(() => {
      const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
          navigate("/login");
          return;
        }

        try {
          const response = await fetch("http://localhost:5000/check-auth", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            navigate("/login"); 
          }
        } catch (error) {
          console.error("Ошибка проверки аутентификации:", error);
          navigate("/login");
        }
      };

      checkAuth();
    }, [navigate]);

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
