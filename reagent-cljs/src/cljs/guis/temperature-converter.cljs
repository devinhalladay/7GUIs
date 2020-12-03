(ns guis.temperature-converter
  (:require [reagent.core :refer [atom]]))

(def celsius->fahrenheit #(+ 32 (* (/ 9 5) %)))
(def fahrenheit->celsius #(* (/ 5 9) (- % 32)))

(defn component []
  (let [temperature (atom {:celsius "" :fahrenheit ""})]
    (fn []
      [:div
       [:h1 "Temperature Converter"]
       [:input {:type "number"
                :on-input #(reset! temperature (let [val (-> % .-target .-value)]
                                                 {:celsius val :fahrenheit (.round js/Math (celsius->fahrenheit val))}))
                :value (:celsius @temperature)}]
       [:input {:type "number"
                :on-input #(reset! temperature (let [val (-> % .-target .-value)]
                                                 {:fahrenheit val :celsius (.round js/Math (fahrenheit->celsius val))}))
                :value (:fahrenheit @temperature)}]])))





  ; Originally I was hoping to write a single function i could use to alter state according to which input has changed — it seemed elegant as an idea. this wasn't a good solution for several reasons:
  ;; (defn calc-temp [deg unit]
  ;;   (cond-> 0
  ;;     (= unit "fahrenheit") (* (- deg 32) (/ 5 9))
  ;;     (= unit "celsius") (+ 32 (* deg (/ 9 5)))))

  ;; (defn input-element
  ;;   "A generic input element which updates its value on change"
  ;;   [id name type value]
  ;;   [:input {:id id
  ;;            :name name
  ;;            :class "form-control"
  ;;            :type type
  ;;            :defaultValue @value
  ;;            :on-change #(swap! temperature-data (keyword type) (calc-temp (-> % .-target .-value) @type))}])
  ;; Used swap! beacuse intuitively I guess that sounds like it's for
  ;; transient changes vs !reset for, uh, resetting state


  ;; (defn fahrenheit-input
  ;;   [deg]
  ;;   (input-element "fahrenheit" "fahrenheit" "number" deg))

  ;; (defn celsius-input
  ;;   [deg]
  ;;   (input-element "celsius" "celsius" "number" deg))
  ;;   
  ;; (defn component []
  ;;   (let [temp (atom {:c "" :f ""})]
  ;;     (fn []
  ;;       [:div
;;       (let [f (atom 0)])
;;       ;;  (fahrenheit-input f))
        ;; (let [c (atom 0)])
        ;;  (celsius-input c))])