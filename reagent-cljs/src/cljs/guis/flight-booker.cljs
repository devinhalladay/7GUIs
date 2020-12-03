(ns guis.flight-booker
  (:require [reagent.core :as r]))

(def constants {:T1 "One Way"
                :T2 "Round Trip"
                :TODAY ((.getDate (js/Date.)) "-"
                        (.getMonth (js/Date.)) "-"
                        (.getFullYear (js/Date.)))})

(defonce state (r/atom {:trip-type [:T1 constants]
                        :start-date-time [:TODAY constants]
                        :end-date-time [:TODAY constants]}))

(defn flight-booker
  []
  (fn []
    [:div
     (js/console [:TODAY constants])
     [:select {:name "Trip type"
               :value [state :trip-type]
               :on-change #(swap! state assoc :trip-type [(keyword (-> % .-target .-value)) constants])}

      [:option {:value [:T1 constants]} "One-way flight"]
      [:option {:value [:T2 constants]} "Round trip"]]
     [:input {:name "Departure date"
              :type "date"
              :valueAsDate [@state :start-date-time]
              :on-change #(swap! state assoc :start-date-time (-> % .-target .-valueAsDate))}]
     [:input {:name "Return date"
              :type "date"
              :value [:end-date-time @state]
              :valueAsDate [:end-date-time @state]
              :on-change #(swap! state assoc :end-date-time (-> % .-target .-valueAsDate))}]
     [:button {:on-click #(js/alert (str "You have booked a " [@state :trip-type] "on " [@state :trip-type]))} "Book flight"]]))