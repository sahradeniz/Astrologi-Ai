import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button'; // Import back button
import styled from 'styled-components';

const LifePurposePage = () => {
  const navigate = useNavigate();

  return (
    <StyledWrapper>
      <h3>Your Life Path</h3>
      <p>Your life purpose is about exploring new opportunities and embracing change.</p>
      <Button />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  h3 {
    text-align: center;
    color: #fff;
  }

  p {
    text-align: center;
    font-size: 18px;
    color: #ccc;
    margin-top: 20px;
  }
`;

export default LifePurposePage;
