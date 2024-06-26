import { Button } from "@mui/material";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const UserDashboard = () => {
  
  const [tokenMatch, setTokenMatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState([])
    const exploreRef = useRef(null);
  const menuURL = `https://oibsip-90i2.onrender.com/user/pizzaDashboard`;
  const navigate = useNavigate();
  useEffect(() => {


    axios.get(menuURL)
    .then((response) => {
      setMenu(response.data)

    })

 
  }, [navigate, loading]);

    const handleExploreClick = () => {
      exploreRef.current.scrollIntoView({ behavior: "smooth" });
    };

  return (
    <>
      <section className="bg-gray-100 h-full lg:px-5 lg:py-5">
        <main className="bg-white lg:p-20 p-10 pexels justify-center">
          <h1 className="landingText text-white text-center lg:mt-10 lg:mb-10 mt-20">
            PIZZACLE
          </h1>
          <div className="space-x-10  justify-center lg:flex hidden">
            <Link to='/user/product'>
            <Button
              variant="contained"
              className="!bg-green-700 !p-3 w-60 text-white"
            >
              Menu
            </Button>
            </Link>

            <Button
              variant="contained"
              onClick={handleExploreClick}
              className="!bg-white  !p-3 w-60 !text-black"
            >
              Explore
            </Button>
          </div>
        </main>
        <div ref={exploreRef}>
          <main className="bg-white lg:mt-10">
            <div className="bg-green-900 w-full p-2 text-white text-center flex justify-between lg:px-10">
              <p>You have a big appetite?</p>
              <Link to="/user/product">See more</Link>
            </div>
            <div className=" h-fit flex justify-center flex-wrap lg:px-7 lg:bg-white bg-gray-200 px-4 lg:py-10 py-3 gap-5">
            {menu.map((pizza, i) => (
                <Link to={`/user/description/${i}`}  key={pizza.id} className="max-w-sm rounded overflow-hidden shadow-lg w-full !bg-white">
                  <img
                    className="w-full"
                    src={pizza.image_URL}
                    alt={pizza.name}
                  />
                  <div className="px-6 py-4">
                    <div className="font-bold text-xl mb-2">{pizza.name}</div>
                    <p className="text-gray-700 text-base">{pizza.description}</p>
                    <p className="text-white text-base bg-green-700 p-2 w-32 rounded-md text-center my-5">Price: ${pizza.price}</p>
                  </div>
                </Link>
              ))}

              
             
            </div>
          </main>
        </div>

       
      </section>
    </>
  );
};

export default UserDashboard;
