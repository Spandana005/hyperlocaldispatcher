import React, {
  useEffect,
  useState,
} from "react";

import API from "../api";

const Riders = () => {

  // =========================
  // STATE
  // =========================
  const [riders, setRiders] =
    useState([]);


  // =========================
  // USE EFFECT
  // =========================
  useEffect(() => {

    fetchRiders();

    const interval =
      setInterval(() => {

        fetchRiders();

      }, 5000);

    return () =>
      clearInterval(interval);

  }, []);


  // =========================
  // FETCH RIDERS
  // =========================
  const fetchRiders =
    async () => {

      try {

        const res =
          await API.get(
            "/api/admin/riders"
          );

        setRiders(res.data);

      }

      catch (err) {

        console.log(err);

      }

  };


  // =========================
  // BLOCK RIDER
  // =========================
  const blockRider =
    async (riderId) => {

      try {

        await API.put(

          `/api/admin/block-rider/${riderId}`

        );

        fetchRiders();

      }

      catch (err) {

        console.log(err);

      }

  };


  // =========================
  // UNBLOCK RIDER
  // =========================
  const unblockRider =
    async (riderId) => {

      try {

        await API.put(

          `/api/admin/unblock-rider/${riderId}`

        );

        fetchRiders();

      }

      catch (err) {

        console.log(err);

      }

  };


  return (

    <div className="p-6">

      {/* HEADING */}
      <div className="mb-8">

        <h1
          className="
          text-4xl
          font-bold
          text-blue-600
          "
        >

          Riders

        </h1>

        <p
          className="
          text-gray-600
          mt-2
          "
        >

          Monitor rider deliveries
          and assigned orders.

        </p>

      </div>


      {/* RIDERS TABLE */}
      <div
        className="
        bg-white
        shadow-xl
        rounded-2xl
        p-6
        overflow-x-auto
        "
      >

        <table
          className="
          w-full
          border-collapse
          "
        >

          {/* TABLE HEAD */}
          <thead>

            <tr
              className="
              bg-blue-100
              text-left
              "
            >

              <th className="p-4">

                Rider Name

              </th>

              <th className="p-4">

                Phone

              </th>

              <th className="p-4">

                Customer

              </th>

              <th className="p-4">

                Order ID

              </th>

              <th className="p-4">

                Delivery Status

              </th>

              <th className="p-4">

                Action

              </th>

            </tr>

          </thead>


          {/* TABLE BODY */}
          <tbody>

            {
              riders.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="
                    text-center
                    py-16
                    "
                  >

                    <div
                      className="
                      flex
                      flex-col
                      items-center
                      "
                    >

                      <h1
                        className="
                        text-6xl
                        mb-4
                        "
                      >

                        🛵

                      </h1>

                      <p
                        className="
                        text-2xl
                        font-semibold
                        text-gray-700
                        "
                      >

                        No Riders Found

                      </p>

                      <p
                        className="
                        text-gray-500
                        mt-2
                        "
                      >

                        Riders and their
                        assigned orders
                        will appear here.

                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                riders.map((rider) => (

                  <tr
                    key={rider._id}
                    className="
                    border-b
                    hover:bg-gray-50
                    "
                  >

                    {/* RIDER NAME */}
                    <td className="p-4">

                      {rider.name}

                    </td>


                    {/* PHONE */}
                    <td className="p-4">

                      {
                        rider.phone || "-"
                      }

                    </td>


                    {/* CUSTOMER */}
                    <td className="p-4">

                      {
                        rider.currentOrder
                          ?.customerName || "-"
                      }

                    </td>


                    {/* ORDER ID */}
                    <td className="p-4">

                      {
                        rider.currentOrder
                          ?._id?.slice(-5) || "-"
                      }

                    </td>


                    {/* STATUS */}
                    <td className="p-4">

                      <span

                        className={`

                          px-3
                          py-1
                          rounded-full
                          text-sm

                          ${

                            rider.isActive

                            ? rider.isAvailable

                              ? "bg-green-100 text-green-700"

                              : "bg-yellow-100 text-yellow-700"

                            : "bg-red-100 text-red-700"

                          }

                        `}

                      >

                        {

                          !rider.isActive

                          ? "Blocked"

                          : rider.isAvailable

                          ? "Available"

                          : "Delivering"

                        }

                      </span>

                    </td>


                    {/* ACTION */}
                    <td className="p-4">

                      <div className="flex gap-3">

                        {
                          rider.isActive ? (

                            <button

                              onClick={() =>
                                blockRider(
                                  rider._id
                                )
                              }

                              className="
                              bg-red-500
                              text-white
                              px-4
                              py-2
                              rounded-lg
                              hover:bg-red-600
                              "
                            >

                              Block

                            </button>

                          ) : (

                            <button

                              onClick={() =>
                                unblockRider(
                                  rider._id
                                )
                              }

                              className="
                              bg-green-600
                              text-white
                              px-4
                              py-2
                              rounded-lg
                              hover:bg-green-700
                              "
                            >

                              Unblock

                            </button>

                          )
                        }

                      </div>

                    </td>

                  </tr>

                ))

              )
            }

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default Riders;