import React, { useState } from "react";
import { RangeDatePicker } from "jalali-react-datepicker";
import Plot from "react-plotly.js";
import axios from "axios";
import { CSVLink } from "react-csv";
import moment from "moment-jalaali";
// import express from "express";

// var app = express();
// app.use(cors());

import "./App.css";

const getDatesBetweenDates = (startDate, endDate) => {
  let dates = [];
  var theDate = startDate;
  while (
    moment(theDate).format("YYYYMMDD") <= moment(endDate).format("YYYYMMDD")
  ) {
    dates = [...dates, theDate];
    theDate = moment(theDate).add(1, "day");
  }
  return dates;
};

const GetData = async (date, name) => {
  console.log(
    `http://cdn.tsetmc.com/Loader.aspx?ParTree=15131P&i=${name}&d=${date}`
  );
  let splitData = [];
  await axios
    .get(
      `https://cors-anywhere.herokuapp.com/http://cdn.tsetmc.com/Loader.aspx?ParTree=15131P&i=${name}&d=${date}`
    )
    .then((response) => {
      let data = response.data.substring(
        response.data.search("var IntraTradeData") +
        "var IntraTradeData=".length,
        response.data.search("var ShareHolderData")
      );
      let nameData = response.data.substring(
        response.data.search("var InstSimpleData") +
        "var InstSimpleData".length,
        response.data.search("var InstSimpleData") +
        "var InstSimpleData".length +
        20
      );
      console.log(nameData);
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
  const [table, setTable] = useState([[0], [0]]);
  const [shownDate, setShownDate] = useState("");
  const [rangeDate, setRangeDate] = useState([]);
  const [stokName, setStokName] = useState("");

  return (
    <div className="view-div">
      <header className="header-div">
        <form className="input-form">
          <label className="input-form_label">
            نام سهام
            <input
              className="input-form_input-name"
              placeholder={"کد مربوط به سهام را وارد کنید"}
              value={stokName}
              onChange={(e) => {
                setStokName(e.target.value);
              }}
            ></input>
          </label>
        </form>
        <div className="date-picekr-wrapper">
          <RangeDatePicker
            onClickSubmitButton={async (date) => {
              setRangeDate(getDatesBetweenDates(date.start, date.end));
            }}
          />
          <h1 className="date-picker-text ">انتخاب تاریخ</h1>
        </div>
      </header>
      <div className="button-wrapper">
        <button
          className="button-class"
          onClick={() => {
            GetData("20201201", "20024911381434086").then((data) => {
              setTable(UniqueData(MineAndSortData(data)));
            });
          }}
        >
          test
        </button>
        <button
          className="button-class "
          onClick={() => {
            setTable([[0], [0]]);
            setShownDate("");
            // console.log(table);
          }}
        >
          clear
        </button>
      </div>
      <Plot
        className="plot"
        data={[
          {
            x: table[0].map((value) => value),
            y: table[1].map((value) => value),
            type: "scatter",
            mode: "markers",
          },
        ]}
        layout={{
          title: `نمودار حجم قیمت در ${shownDate}`,
          xaxis: {
            // type: "multicategory",
            tickangle: 35,
            showticklabels: true,
            range: [Math.min(...table[0]) - 100, Math.max(...table[0]) + 100],
          },
        }}
      />
      {table ? (
        <CSVLink className="download-data" data={table}>
          دریافت اطلاعات
        </CSVLink>
      ) : undefined}
      <div className="button-wrapper">
        {rangeDate.map((date, index) => {
          if (
            (moment(date).format("ddd") !== "Fri") &
            (moment(date).format("ddd") !== "Thu")
          ) {
            {
              /* console.log(moment(date).format("ddd")); */
            }
            return (
              <button
                className="button-class "
                key={date}
                onClick={() => {
                  GetData(
                    moment(rangeDate[index]).format("YYYYMMDD"),
                    stokName
                  ).then((data) => {
                    setTable(UniqueData(MineAndSortData(data)));
                  });
                  setShownDate(moment(date).format("jYYYY/jM/jD"));
                }}
              >
                {moment(date).format("jYYYY/jM/jD")}
              </button>
            );
          } else {
            return undefined;
          }
        })}
      </div>
    </div>
  );
};

export default App;
