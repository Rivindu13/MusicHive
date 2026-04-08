import React from "react";
import stageImage from "../../assets/stage.png";
import Reveal from "../../components/Reveal";

const BuiltForEveryone = () => {
  return (
    <section className="built" id="about">
      <Reveal className="built-inner">
        <div className="built-text">
          <h2>Built for Everyone.</h2>
          <p>
            Whether you're an artist looking for gigs or an organizer planning
            an event, MusicHive has everything you need.
          </p>
        </div>

        <div className="built-image-wrapper">
          <img src={stageImage} alt="Stage" className="built-image" />
        </div>
      </Reveal>
    </section>
  );
};

export default BuiltForEveryone;