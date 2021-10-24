import React, { useRef, useState, useEffect } from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import CenteredContainer from "./CenteredContainer";
import {
  resetPasswordAsync,
  resetAuthState,
  validateResetTokenAsync,
} from "../../redux/authSlice";
import Spinner from "../common/Spinner";
import CenteredLoader from "../common/CenteredLoader";

const ResetPassword = ({ match }) => {
  const resetPasswordToken = match.params.resetPasswordToken;

  const dispatch = useDispatch();
  const history = useHistory();
  const {
    authToken,
    loading,
    authErrors,
    successMessage,
    validatingToken,
    passwordTokenValid,
  } = useSelector((state) => state.auth);

  if (authToken) {
    history.push("/dashboard");
  }

  const formRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();

  const [error, setError] = useState("");

  useEffect(() => {
    if (resetPasswordToken && resetPasswordToken.length === 40) {
      dispatch(validateResetTokenAsync({ resetToken: resetPasswordToken }));
    }
  }, [dispatch, resetPasswordToken]);

  useEffect( () => {
        let clearMsg;
        if(successMessage){
            formRef.current.reset();
            dispatch(resetAuthState());
            history.push('/login')
        }
        return () => clearTimeout(clearMsg)
    },[successMessage,dispatch,history])

  async function handleSubmit(e) {
    e.preventDefault();
    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }
    try {
      setError("");
       dispatch(resetPasswordAsync({
                password: passwordRef.current.value,
                resetToken: resetPasswordToken
            }))
    } catch (err) {
      setError("Oops Something went wrong! :(");
    }
  }

  return (
    <>
      {!validatingToken ? (
        <CenteredContainer>
          <Card>
            <Card.Body>
              {!passwordTokenValid ? (
                <h3 className="text-center p-4">Reset Link Expired</h3>
              ) : (
                <>
                  <h2 className="text-center mb-4">Reset Password</h2>
                  {error && <Alert variant="danger">{error}</Alert>}
                  { authErrors[0] && <Alert variant="danger">{authErrors[0].msg}</Alert> }
                 {/*  {successMessage && (
                    <Alert variant="success">{successMessage}</Alert>
                  )} */}

                  <Form onSubmit={handleSubmit} ref={formRef}>
                    <Form.Group id="password">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        ref={passwordRef}
                        required
                      />
                    </Form.Group>

                    <Form.Group id="password-confirm">
                      <Form.Label>Password Confirmation</Form.Label>
                      <Form.Control
                        type="password"
                        ref={passwordConfirmRef}
                        required
                      />
                    </Form.Group>
                    {!loading ? (
                      <Button
                        disabled={loading}
                        type="submit"
                        className="w-100 mt-4"
                      >
                        Reset Password
                      </Button>
                    ) : (
                      <Spinner />
                    )}
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-2">
            Already have an account? <Link to="/login">Log In</Link>
          </div>
        </CenteredContainer>
      ) : (
        <CenteredLoader />
      )}
    </>
  );
};

export default ResetPassword;
