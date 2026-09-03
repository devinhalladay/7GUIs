(ns guis.flight-booker
  (:require [reagent.core :as r]))

(def trip-types {"one-way" "One-way flight"
                 "return" "Return flight"})

(defn- iso-today []
  (subs (.toISOString (js/Date.)) 0 10))

(defonce state (r/atom {:trip-type "one-way"
                        :start-date (iso-today)
                        :return-date (iso-today)}))

(defn- return-trip? [{:keys [trip-type]}]
  (= trip-type "return"))

(defn- valid-date? [s]
  (and (string? s)
       (re-matches #"\d{4}-\d{2}-\d{2}" s)
       (not (js/isNaN (.parse js/Date s)))))

(defn- bookable? [{:keys [start-date return-date] :as flight}]
  (and (valid-date? start-date)
       (if (return-trip? flight)
         (and (valid-date? return-date)
              (<= (.parse js/Date start-date) (.parse js/Date return-date)))
         true)))

(defn- booking-message [{:keys [start-date return-date] :as flight}]
  (if (return-trip? flight)
    (str "You have booked a return flight, departing on " start-date
         " and returning on " return-date ".")
    (str "You have booked a one-way flight on " start-date ".")))

(defn flight-booker []
  (fn []
    (let [flight @state]
      [:div
       [:h1 "Flight Booker"]
       [:select {:name "trip-type"
                 :value (:trip-type flight)
                 :on-change #(swap! state assoc :trip-type (-> % .-target .-value))}
        (for [[value label] trip-types]
          ^{:key value} [:option {:value value} label])]
       [:input {:name "start-date"
                :type "date"
                :value (:start-date flight)
                :on-change #(swap! state assoc :start-date (-> % .-target .-value))}]
       [:input {:name "return-date"
                :type "date"
                :disabled (not (return-trip? flight))
                :value (:return-date flight)
                :on-change #(swap! state assoc :return-date (-> % .-target .-value))}]
       [:button {:disabled (not (bookable? flight))
                 :on-click #(js/alert (booking-message flight))}
        "Book flight"]])))
