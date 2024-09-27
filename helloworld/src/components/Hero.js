import PropTypes from "prop-types";

const Hero = ({ showTests, setShowTests }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to GrindOlympiads!</h1>
        <button
          onClick={() => setShowTests(!showTests)}
          className="bg-white text-blue-500 font-bold py-2 px-4 rounded-full hover:bg-blue-100 transition duration-300"
          type="submit"
        >
          {showTests ? "Hide Tests" : "View Tests"}
        </button>
      </div>
    </div>
  );
};

Hero.propTypes = {
  showTests: PropTypes.bool.isRequired,
  setShowTests: PropTypes.func.isRequired,
};

export default Hero;
