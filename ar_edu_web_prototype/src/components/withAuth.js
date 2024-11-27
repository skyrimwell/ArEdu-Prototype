import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate();

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch("http://localhost:5000/check-auth", {
            method: "GET",
            credentials: "include", // Включаем куки
          });

          if (!response.ok) {
            navigate("/login"); // Если пользователь не авторизован
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
