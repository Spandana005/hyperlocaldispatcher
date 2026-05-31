import React, {
  useEffect,
  useState,
} from "react";

import API from "../api";
import useTrackingStore from "../store/trackingstore";

const MyOrders = () => {

  const [orders, setOrders] =
    useState([]);

  // NEW
  const [

    availableOrders,

    setAvailableOrders,

  ] = useState([]);

  const startTracking = useTrackingStore((state) => state.startTracking);
  const stopTracking = useTrackingStore((state) => state.stopTracking);


  // =========================
  // USE EFFECT
  // =========================
  useEffect(() => {

    fetchOrders();

    fetchAvailableOrders();

  }, []);


  // =========================
  // GET ASSIGNED ORDERS
  // =========================
  const fetchOrders = async () => {

    try {

      const res =
        await API.get(
          "/api/rider/my-orders"
        );

      setOrders(res.data);

    }

    catch (err) {

      console.log(err);

    }

  };


  // =========================
  // GET AVAILABLE ORDERS
  // =========================
  const fetchAvailableOrders =
    async () => {

      try {

        const res =
          await API.get(

            "/api/rider/available-orders"

          );

        setAvailableOrders(
          res.data
        );

      }

      catch (err) {

        console.log(err);

      }

  };


  // =========================
  // ACCEPT / REJECT
  // =========================
  const respondOrder = async (

    orderId,

    action

  ) => {

    try {

      await API.put(

        `/api/rider/respond-order/${orderId}`,

        { action }

      );

      fetchOrders();

      fetchAvailableOrders();

    }

    catch (err) {

      console.log(err);

    }

  };


  // =========================
  // UPDATE ORDER STATUS
  // =========================
  const updateStatus =
    async (

      orderId,

      status

    ) => {

      try {

        await API.put(

          `/api/rider/update-status/${orderId}`,

          { status }

        );

        // Geolocation live tracking reaction
        if (status === "dispatched") {
          console.log(`[MY ORDERS] Order ${orderId} dispatched. Starting location tracking.`);
          startTracking(orderId);
        } else if (status === "delivered") {
          console.log(`[MY ORDERS] Order ${orderId} delivered. Stopping location tracking.`);
          await stopTracking();
        }

        fetchOrders();

      }

      catch (err) {

        console.log(err);

      }

  };


  return (

    <div className="p-6">

      {/* HEADING */}
      <div className="mb-8">

        <h1 className="text-4xl font-bold text-green-600">

          My Orders

        </h1>

        <p className="text-gray-600 mt-2">

          View and manage your
          delivery orders.

        </p>

      </div>


      {/* AVAILABLE ORDERS */}

      {
        availableOrders.length > 0 && (

          <div className="mb-10">

            <h2
              className="
              text-3xl
              font-bold
              mb-6
              text-orange-500
              "
            >

              Nearby Order Requests

            </h2>


            <div
              className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-6
              "
            >

              {
                availableOrders.map(

                  (order) => (

                    <div
                      key={order._id}
                      className="
                      bg-white
                      shadow-xl
                      rounded-2xl
                      p-6
                      border-2
                      border-orange-300
                      "
                    >

                      <div
                        className="
                        flex
                        justify-between
                        items-center
                        "
                      >

                        <h2
                          className="
                          text-2xl
                          font-bold
                          "
                        >

                          {order.customerName}

                        </h2>

                        <span
                          className="
                          bg-orange-100
                          text-orange-700
                          px-3
                          py-1
                          rounded-full
                          text-sm
                          "
                        >

                          New Request

                        </span>

                      </div>


                      <div
                        className="
                        mt-4
                        space-y-2
                        "
                      >

                        <p>

                          <span
                            className="
                            font-semibold
                            "
                          >

                            Phone:

                          </span>

                          {" "}

                          {order.phone}

                        </p>

                        <p>

                          <span
                            className="
                            font-semibold
                            "
                          >

                            Address:

                          </span>

                          {" "}

                          <>
  {order.address?.building},{" "}
  {order.address?.area},{" "}
  {order.address?.city},{" "}
  {order.address?.state} -{" "}
  {order.address?.pincode}
</>

                        </p>


                        {/* LANDMARK */}
                        <p>
                          <span className="font-semibold">Landmark:</span>{" "}
                          {order.address?.landmark || "-"}
                        </p>

                        {/* COORDINATES */}
                        <p>
                          <span className="font-semibold text-blue-600">Exact Location:</span>{" "}
                          <span className="font-mono text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                            {order.deliveryLocation?.lat || 0}, {order.deliveryLocation?.lng || 0}
                          </span>
                        </p>


                        <p>

                          <span
                            className="
                            font-semibold
                            "
                          >

                            Order Details:

                          </span>

                          {" "}

                          {order.orderDetails}

                        </p>

                      </div>


                      {/* BUTTONS */}

                      <div
                        className="
                        flex
                        gap-4
                        mt-6
                        "
                      >

                        <button
                          onClick={() =>
                            respondOrder(

                              order._id,

                              "accept"

                            )
                          }
                          className="
                          bg-green-600
                          text-white
                          px-5
                          py-2
                          rounded-xl
                          hover:bg-green-700
                          "
                        >

                          Accept

                        </button>


                        <button
                          onClick={() =>
                            respondOrder(

                              order._id,

                              "reject"

                            )
                          }
                          className="
                          bg-red-500
                          text-white
                          px-5
                          py-2
                          rounded-xl
                          hover:bg-red-600
                          "
                        >

                          Reject

                        </button>

                      </div>

                    </div>

                  )

                )
              }

            </div>

          </div>

        )
      }


      {/* ASSIGNED ORDERS */}

      <div
        className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-6
        "
      >

        {
          orders.length === 0 ? (

            <div
              className="
              bg-white
              shadow-xl
              rounded-2xl
              p-10
              flex
              flex-col
              items-center
              justify-center
              min-h-[300px]
              "
            >

              <h1 className="text-7xl mb-5">

                📦

              </h1>

              <p
                className="
                text-2xl
                font-semibold
                text-gray-700
                "
              >

                No Active Orders

              </p>

              <p
                className="
                text-gray-500
                mt-2
                text-center
                "
              >

                Accepted orders
                will appear here.

              </p>

            </div>

          ) : (

            orders.map((order) => (

              <div
                key={order._id}
                className="
                bg-white
                shadow-xl
                rounded-2xl
                p-6
                "
              >

                <div
                  className="
                  flex
                  justify-between
                  items-center
                  "
                >

                  <h2
                    className="
                    text-2xl
                    font-bold
                    "
                  >

                    {order.customerName}

                  </h2>

                  <span
                    className="
                    bg-green-100
                    text-green-700
                    px-3
                    py-1
                    rounded-full
                    text-sm
                    "
                  >

                    {order.status}

                  </span>

                </div>


                <div
                  className="
                  mt-4
                  space-y-2
                  "
                >

                  <p>

                    <span
                      className="
                      font-semibold
                      "
                    >

                      Phone:

                    </span>

                    {" "}

                    {order.phone}

                  </p>

                  <p>

                    <span
                      className="
                      font-semibold
                      "
                    >

                      Address:

                    </span>

                    {" "}

                    <>
  {order.address?.building},{" "}
  {order.address?.area},{" "}
  {order.address?.city},{" "}
  {order.address?.state} -{" "}
  {order.address?.pincode}
</>

                  </p>


                  {/* LANDMARK */}
                  <p>
                    <span className="font-semibold">Landmark:</span>{" "}
                    {order.address?.landmark || "-"}
                  </p>

                  {/* COORDINATES */}
                  <p>
                    <span className="font-semibold text-blue-600">Exact Location:</span>{" "}
                    <span className="font-mono text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                      {order.deliveryLocation?.lat || 0}, {order.deliveryLocation?.lng || 0}
                    </span>
                  </p>


                  <p>

                    <span
                      className="
                      font-semibold
                      "
                    >

                      Order Details:

                    </span>

                    {" "}

                    {order.orderDetails}

                  </p>

                </div>


                {/* ACTION BUTTONS */}
                <div
                  className="
                  flex
                  gap-3
                  mt-6
                  flex-wrap
                  "
                >

                  {/* GOOGLE MAPS */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation?.lat || 0},${order.deliveryLocation?.lng || 0}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-650 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm text-xs shrink-0 flex items-center gap-1"
                  >
                    🗺️ Open Maps
                  </a>


                  {/* START DELIVERY */}
                  {
                    order.status ===
                    "accepted" && (

                      <button

                        onClick={() =>
                          updateStatus(

                            order._id,

                            "dispatched"

                          )
                        }

                        className="
                        bg-purple-600
                        text-white
                        px-4
                        py-2
                        rounded-xl
                        "
                      >

                        Start Delivery

                      </button>

                    )
                  }


                  {/* MARK DELIVERED */}
                  {
                    order.status ===
                    "dispatched" && (

                      <button

                        onClick={() =>
                          updateStatus(

                            order._id,

                            "delivered"

                          )
                        }

                        className="
                        bg-green-600
                        text-white
                        px-4
                        py-2
                        rounded-xl
                        "
                      >

                        Mark Delivered

                      </button>

                    )
                  }

                </div>

              </div>

            ))

          )
        }

      </div>


      {/* STATUS GUIDE */}

      <div
        className="
        bg-white
        shadow-xl
        rounded-2xl
        p-6
        mt-10
        "
      >

        <h2
          className="
          text-2xl
          font-bold
          mb-6
          "
        >

          Delivery Status Guide

        </h2>


        <div
          className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-6
          "
        >

          <div
            className="
            border
            rounded-xl
            p-5
            "
          >

            <h3
              className="
              text-xl
              font-bold
              text-yellow-500
              mb-3
              "
            >

              🟡 Assigned

            </h3>

            <p className="text-gray-600">

              Order assigned to rider.

            </p>

          </div>


          <div
            className="
            border
            rounded-xl
            p-5
            "
          >

            <h3
              className="
              text-xl
              font-bold
              text-blue-600
              mb-3
              "
            >

              🔵 Dispatched

            </h3>

            <p className="text-gray-600">

              Order is on the way.

            </p>

          </div>


          <div
            className="
            border
            rounded-xl
            p-5
            "
          >

            <h3
              className="
              text-xl
              font-bold
              text-green-600
              mb-3
              "
            >

              🟢 Delivered

            </h3>

            <p className="text-gray-600">

              Order delivered successfully.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

};

export default MyOrders;