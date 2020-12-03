(ns guis.counter
  (:require [reagent.core :as r]))

(defonce counter-click-state (r/atom 0))

(defn counter []
  [:div
   [:h1 "Counter"]
   [:input {:type "number" :value @counter-click-state}]
   [:button {:on-click #(swap! counter-click-state inc)} "Count"]])