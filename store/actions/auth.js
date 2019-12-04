import { AsyncStorage } from "react-native";

export const AUTHENTICATE = "AUTHENTICATE";
export const LOGOUT = "LOGOUT";

let timer;

export const authenticate = (userId, token, expiryTime) => {
  return dispatch => {
    dispatch(setLogOutTimer(expiryTime));
    dispatch({
      type: AUTHENTICATE,
      userId,
      token
    });
  };
};

export const signup = (email, password) => {
  return async dispatch => {
    const response = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCR7hRqEwsKfdarlnPn5icCpJgcs7DN--E",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      }
    );

    if (!response.ok) {
      const resError = await response.json();
      const errorId = resError.error.message;
      let message = "Something went wrong.";
      if (errorId === "EMAIL_EXISTS") {
        message = "The email address is already in use by another account.";
      } else if (errorId === "OPERATION_NOT_ALLOWED") {
        message = "Password sign-in is disabled.";
      } else if (errorId === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        message =
          "We have blocked all requests from this device due to unusual activity. Try again later.";
      }
      throw new Error(message);
    }

    const resData = await response.json();
    dispatch(authenticate(resData.localId, resData.idToken, parseInt(resData.expiresIn) * 1000));
    const expirationTime = new Date(new Date().getTime() + parseInt(resData.expiresIn) * 1000);
    saveDataToStorage(resData.idToken, resData.localId, expirationTime);
  };
};

export const login = (email, password) => {
  return async dispatch => {
    const response = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyCR7hRqEwsKfdarlnPn5icCpJgcs7DN--E",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      }
    );

    if (!response.ok) {
      const resError = await response.json();
      const errorId = resError.error.message;
      let message = "Something went wrong.";
      if (errorId === "EMAIL_NOT_FOUND") {
        message = "There is no user record corresponding to this email.";
      } else if (errorId === "INVALID_PASSWORD") {
        message = "Incorrect Password! Please check your password again.";
      } else if (errorId === "USER_DISABLED") {
        message = "Account is disabled.";
      }
      throw new Error(message);
    }

    const resData = await response.json();
    dispatch(authenticate(resData.localId, resData.idToken, parseInt(resData.expiresIn) * 1000));
    const expirationTime = new Date(new Date().getTime() + parseInt(resData.expiresIn) * 1000);
    saveDataToStorage(resData.idToken, resData.localId, expirationTime);
  };
};

export const logOut = () => {
  clearLogOutTimer();
  AsyncStorage.removeItem("userData");
  return {
    type: LOGOUT
  };
};

const clearLogOutTimer = () => {
  if (timer) {
    clearTimeout(timer);
  }
};

const setLogOutTimer = time => {
  return dispatch => {
    timer = setTimeout(() => {
      dispatch(logOut());
    }, time);
  };
};

const saveDataToStorage = (token, userId, expirationTime) => {
  AsyncStorage.setItem(
    "userData",
    JSON.stringify({
      token: token,
      userId: userId,
      expiryDate: expirationTime.toISOString()
    })
  );
};
