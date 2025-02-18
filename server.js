require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const ORS_API_KEY = '5b3ce3597851110001cf6248bb6afba212e84a35ac2c262a2b0e526d';

app.post("/hitung", async (req, res) => {
  try {
    const { origin } = req.body;

    if (!origin) {
      return res.status(400).json({ error: "Harap sertakan origin dan destination." });
    }

    const userLocation = [origin.lng, origin.lat];
    const stores = [
      {
        "namatoko": "Toko 1",
        "lat": -6.173494319924143,
        "lng": 106.88853979110719
      },
      {
        "namatoko": "Toko 2",
        "lat": -6.17562564514267,
        "lng": 106.83078797494886
      },
      {
        "namatoko": "Toko 3",
        "lat": - 6.161141230857807,
        "lng": 106.68112695418894
      }
    ];

    const coordinates = [userLocation];
    let destinations = [];

    stores.forEach((store, index) => {
      coordinates.push([store.lng, store.lat]);
      destinations.push(index + 1);
    });

    const getAddress = async (lat, lng) => {
      try {
        const response = await axios.get(`https://api.openrouteservice.org/geocode/reverse`, {
          params: {
            api_key: ORS_API_KEY,
            'point.lat': lat,
            'point.lon': lng,
            size: 1
          }
        });

        return response.data.features[0].properties.label;
      } catch (error) {
        console.error(`Gagal mendapatkan alamat untuk ${lat}, ${lng}:`, error.response?.data || error.message);
        return 'Alamat tidak ditemukan';
      }
    };

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/matrix/driving-car',
      {
        locations: coordinates,
        metrics: ['distance', 'duration'],
        sources: [0],
        destinations: destinations
      },
      {
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const distances = response.data.distances[0];
    const durations = response.data.durations[0];

    const data = [];
    // stores.forEach(async (store, index) => {
    //   const entry = {
    //     namatoko: store.namatoko,
    //     jarak: (distances[index] / 1000),
    //     waktu: durations[index],
    //   }

    //   const address = await getAddress(store.lat, store.lng);
    //   console.log(address);

    //   data.push(entry);
    // });
    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      const entry = {
        namatoko: store.namatoko,
        jarak: distances[i] / 1000,
        waktu: durations[i] / 60,
      };

      const address = await getAddress(store.lat, store.lng);
      entry.alamat = address;  // Menambahkan alamat ke entry

      data.push(entry);  // Masukkan entry setelah alamat didapat
    }


    return res.json({
      status_code: 200,
      message: "Success Retrieve Distance Data",
      rows: data
    })
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3500, () => console.log("Server berjalan di port 3500"));
