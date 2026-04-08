// Hero.jsx
import React, { useEffect, useState } from "react";
import heroImage from "../../assets/hero-bg.png";
import Reveal from "../../components/Reveal";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const Hero = () => {
  const navigate = useNavigate();

  const [showArtists, setShowArtists] = useState(false);
  const [artists, setArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [artistsError, setArtistsError] = useState("");

  async function loadArtists() {
    try {
      setLoadingArtists(true);
      setArtistsError("");

      const res = await fetch(`${API_BASE}/api/users/artists?onlyComplete=true`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load artists");
      }

      setArtists(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setArtistsError(err.message || "Failed to load artists");
      setArtists([]);
    } finally {
      setLoadingArtists(false);
    }
  }

  const handleBrowseArtists = async () => {
    const nextShow = !showArtists;
    setShowArtists(nextShow);

    if (!showArtists && artists.length === 0) {
      await loadArtists();
    }

    setTimeout(() => {
      const section = document.getElementById("artists-gallery");
      if (section && nextShow) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        setShowArtists(false);
      }
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <section
        id="home"
        className="hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="hero-overlay">
          <Reveal className="hero-content">
            <div className="hero-pill">
              ✨ Sri Lanka&apos;s Premier Music Platform
            </div>

            <h1 className="hero-title">Connect. Perform. Thrive.</h1>

            <p className="hero-subtitle">
              Join the ultimate platform connecting Sri Lanka&apos;s finest
              musicians, bands, and event organizers. Create your profile,
              discover opportunities, and take your music career to the next
              level.
            </p>

            <div className="hero-buttons">
              <button
                className="btn btn-gradient btn-animate btn-cta"
                onClick={() => navigate("/signup")}
                type="button"
              >
                Start Your Journey
              </button>

              <button
                className="btn btn-outline btn-animate"
                onClick={handleBrowseArtists}
                type="button"
              >
                {showArtists ? "Hide Artists" : "Browse Artists"}
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {showArtists && (
        <section id="artists-gallery" className="artistsGallerySection">
          <div className="artistsGalleryHeader">
            <div>
              <h2 className="artistsGalleryTitle">Available Artists</h2>
              <p className="artistsGallerySubtitle">
                Explore artists and bands currently in the system.
              </p>
            </div>

            <button
              className="artistsGalleryClose"
              onClick={() => setShowArtists(false)}
              type="button"
            >
              Close
            </button>
          </div>

          {loadingArtists && (
            <div className="artistsGalleryState">Loading artists...</div>
          )}

          {!loadingArtists && artistsError && (
            <div className="artistsGalleryState artistsGalleryState--error">
              {artistsError}
            </div>
          )}

          {!loadingArtists && !artistsError && artists.length === 0 && (
            <div className="artistsGalleryState">
              No artists available right now.
            </div>
          )}

          {!loadingArtists && !artistsError && artists.length > 0 && (
            <div className="artistsGalleryGrid">
              {artists.map((artist) => {
                const image =
                  artist.photoURL ||
                  "https://via.placeholder.com/300x220?text=Artist";

                const genres = Array.isArray(artist.artistProfile?.genres)
                  ? artist.artistProfile.genres.slice(0, 3)
                  : [];

                const location = artist.artistProfile?.location || "Sri Lanka";

                const price =
                  typeof artist.artistProfile?.pricePerHour === "number"
                    ? `LKR ${artist.artistProfile.pricePerHour.toLocaleString()}`
                    : "Price on request";

                return (
                  <div className="artistPublicCard" key={artist.uid}>
                    <div
                      className="artistPublicCard__image"
                      style={{ backgroundImage: `url(${image})` }}
                    />

                    <div className="artistPublicCard__body">
                      <div className="artistPublicCard__top">
                        <h3 className="artistPublicCard__name">
                          {artist.name || "Unnamed Artist"}
                        </h3>
                        <span className="artistPublicCard__role">
                          {artist.role === "band" ? "Band" : "Artist"}
                        </span>
                      </div>

                      <p className="artistPublicCard__meta">{location}</p>

                      <div className="artistPublicCard__genres">
                        {genres.length > 0 ? (
                          genres.map((genre, index) => (
                            <span className="artistGenrePill" key={`${artist.uid}-${index}`}>
                              {genre}
                            </span>
                          ))
                        ) : (
                          <span className="artistGenrePill">Music</span>
                        )}
                      </div>

                      <div className="artistPublicCard__price">{price}</div>

                      <button
                        className="btn btn-gradient btn-animate artistPublicCard__btn"
                        onClick={() => navigate("/login")}
                        type="button"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
};

export default Hero;