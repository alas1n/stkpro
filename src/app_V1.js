import React, { useState } from "react";
import { RangeDatePicker } from "jalali-react-datepicker";
import Plot from "react-plotly.js";
import axios from "axios";
import https from "https";
import { CSVLink } from "react-csv";
import moment from "moment";

const getDatesBetweenDates = (startDate, endDate) => {
  let dates = [];
  let theDate = moment(startDate);
  while (moment(theDate).format("YYYYMDD") !== endDate) {
    dates = [...dates, moment(theDate).format("YYYYMDD")];
    theDate = moment(theDate).add(1, "d");
  }
  return dates;
};

const GetData = async (date) => {
  const instance = await axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });
  let splitData = [];
  await instance
    .get(
      `https://cdn.tsetmc.com/Loader.aspx?ParTree=15131P&i=20024911381434086&d=${date}`
    )
    .then((response) => {
      let data = response.data.substring(
        response.data.search("var IntraTradeData") +
          "var IntraTradeData=".length,
        response.data.search("var ShareHolderData")
      );
      splitData = data.split("'");
    });
  return splitData;
};

const MineAndSortData = (data) => {
  let indexed_data = [];
  for (var i = 1; i <= data.length; i = i + 8) {
    var _data = [
      parseInt(data[i], 10),
      data[i + 2],
      parseInt(data[i + 4], 10),
      parseInt(data[i + 6], 10),
    ];
    indexed_data.push(_data);
  }
  indexed_data = indexed_data.sort((a, b) => {
    return a[3] - b[3];
  });
  return indexed_data;
};

const UniqueData = (data) => {
  const allPrices = data.map((data) => data[3]);
  const UniquePrices = allPrices.filter((x, i, a) => a.indexOf(x) === i);
  let volumes = [];
  for (let i = 0; i < UniquePrices.length; i++) {
    let volume = 0;
    for (let j = 0; j < data.length; j++) {
      if (UniquePrices[i] === data[j][3]) {
        volume = volume + data[j][2];
      }
    }
    volumes.push(volume);
  }
  data = [[...UniquePrices], [...volumes]];
  return data;
};

const App = () => {
  const [table, setTable] = useState([]);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [rangeDate, setRangeDate] = useState([]);

  return (
    <div>
      <CSVLink data={table}>Download me</CSVLink>
      <RangeDatePicker
        onClickSubmitButton={async (date) => {
          setStartDate(moment(date.start).format("YYYYMDD"));
          setEndDate(moment(date.end).format("YYYYMDD"));
          setRangeDate(getDatesBetweenDates(startDate, endDate));
          console.log(rangeDate);
        }}
      />
      <p>test</p>
      <button
        onClick={() => {
          GetData("20201201").then((data) => {
            MineAndSortData(data).then((data) => {
              UniqueData(data).then((data) => setTable(data));
            });
          });
        }}
      >
        getData
      </button>
      <Plot
        data={[
          {
            x: table[0].map((vale) => vale),
            y: table[1].map((vale) => vale),
            type: "scatter",
            mode: "lines",
          },
        ]}
      />
    </div>
  );
};

export default App;
