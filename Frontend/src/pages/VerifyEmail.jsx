import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/users/verify-email/${token}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Verification failed");

        alert("Email verified successfully!");
        navigate("/signin");
      } catch (err) {
        alert("Verification failed: " + err.message);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return <h2>Verifying your email...</h2>;
};

export default VerifyEmail;
