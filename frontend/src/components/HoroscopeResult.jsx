import PropTypes from 'prop-types';

function HoroscopeResult({ loading, result, error }) {
  if (loading) {
    return (
      <section className="result">
        <p>Yıldız haritası hesaplanıyor...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="result">
        <p>{error}</p>
      </section>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <section className="result">
      <h2>Bugünkü Mesajın</h2>
      {result.zodiacSign && <p>Burcun: {result.zodiacSign}</p>}
      <p>{result.message}</p>
    </section>
  );
}

HoroscopeResult.propTypes = {
  loading: PropTypes.bool,
  result: PropTypes.shape({
    zodiacSign: PropTypes.string,
    message: PropTypes.string
  }),
  error: PropTypes.string
};

HoroscopeResult.defaultProps = {
  loading: false,
  result: null,
  error: null
};

export default HoroscopeResult;
