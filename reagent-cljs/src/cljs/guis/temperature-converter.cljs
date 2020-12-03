(ns guis.temperature-converter
  (:require [reagent.core :as r]))

(def temperature-data (r/atom {:celcius 0 :fahrenheit 0}))

(defn calc-temp [deg unit]
  (cond-> 0
    (= unit "fahrenheit") (* (- deg 32) (/ 5 9))
    (= unit "celsius") (+ 32 (* deg (/ 9 5)))))

(defn input-element
  "An input element which updates its value on change"
  [id name type value]
  [:input {:id id
           :name name
           :class "form-control"
           :type type
           :defaultValue @value
           :on-change #(swap! temperature-data (keyword type) (calc-temp (-> % .-target .-value) @type))
           ;; Used swap! beacuse intuitively I guess that sounds like it's for
           ;; transient changes vs !reset for, uh, resetting state
  }])

(defn fahrenheit-input
  [deg]
  (input-element "fahrenheit" "fahrenheit" "number" deg))

(defn celsius-input
  [deg]
  (input-element "celsius" "celsius" "number" deg))

(defn component []
  [:div
   [:h1 "Temperature Converter"]
   (let [f (atom 0)]
     (fahrenheit-input f))
   (let [c (atom 0)]
     (celsius-input c))])



;;  [:input {:name "Fahrenheit" :value (:fahrenheit @temperature-data) :type "number" :placeholder "Enter temperature…" 
;;             :on-change {#(reset! value (-> % .-target .-value))}}]


;; (ns example
;;   (:require [reagent.core :as r]))
;; (defn atom-input [value]
;;   [:input {:type "text"
;;            :value @value
;;            :on-change #(reset! value (-> % .-target .-value))}])

;; (defn shared-state []
;;   (let [val (r/atom "foo")]
;;     (fn []
;;       [:div
;;        [:p "The value is now: " @val]
;;        [:p "Change it here: " [atom-input val]]])))