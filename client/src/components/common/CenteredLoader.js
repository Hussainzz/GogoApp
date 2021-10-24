import React from "react";
import { Container } from "react-bootstrap";

import Loader from "react-loader-spinner";

const CenteredLoader = () => {
  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-100 text-center" style={{ maxWidth: "400px" }}>
          <h3>Loading...</h3>
        <Loader
          type="Puff"
          color="#00BFFF"
          height={50}
          width={50}
          /* timeout={3000} //3 secs */
        />
      </div>
    </Container>
  );
};

export default CenteredLoader;
