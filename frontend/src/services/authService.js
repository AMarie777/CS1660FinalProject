/**
 * Authentication Service
 * 
 * For this project, "authentication" is mocked.
 * The token MUST be the user's email because backend
 * reads the email from Authorization: Bearer <email>.
 */

export const login = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email && password) {
        const user = {
          id: email,
          email,
          name: email,
        };

        const token = email; // CRITICAL — backend depends on this

        // Save locally
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);

        resolve({ user, token });
      } else {
        reject(new Error("Email and password are required"));
      }
    }, 300);
  });
};

export const signup = async (email, password, name = "") => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email && password) {
        const user = {
          id: email,
          email,
          name: name || email,
        };

        const token = email;

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);

        resolve({ user, token });
      } else {
        reject(new Error("Email, password, and name are required"));
      }
    }, 300);
  });
};

export const logout = async () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

export const verifyToken = async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = getCurrentUser();
      const token = getToken();

      if (user && token) resolve({ user });
      else reject(new Error("No valid session"));
    }, 200);
  });
};

export const getCurrentUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

export const getToken = () => {
  return localStorage.getItem("token");
};