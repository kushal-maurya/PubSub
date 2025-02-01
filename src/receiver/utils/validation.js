export const validatePayload = ({ user, userClass, age, email }) => {
    if (!user || !userClass || !age || !email) {
      return "All fields are required.";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Invalid email format.";
    }
    if (typeof age !== "number" || age <= 0) {
      return "Age must be a positive number.";
    }
    return null; // No validation errors
  };
  