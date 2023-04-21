import { LitElement, html, css } from 'lit'
import React from 'react';
import { createComponent } from '@lit-labs/react';

const skioStyles = css`
  .skio-plan-picker {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0;
    border: 0;
  }
  .skio-onetime-second {
    order: 2;
  }
  
  .skio-group-container {
    display: none;
  }
  .skio-group-container--available {
    display: block;
    position: relative;
    box-shadow: 0 0 5px rgba(23, 24, 24, 0.05), 0 1px 2px rgba(0, 0, 0, 0.07);
    border-radius: 5px;
    border-width: 1px;
    border-color: transparent;
    border-style: solid; 
    transition: border-color 0.2s ease;
  }
  .skio-group-container--selected {
    border-color: #000;
  }
  
  .skio-group-input {
    position: absolute;
    width: 0px;
    height: 0px;
    opacity: 0;
  }
  .skio-group-input:focus-visible ~ .skio-group-label {
    outline: 2px #ccc solid;
    outline-offset: 4px;
    border-radius: 5px;
  }
  
  .skio-group-label {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    padding: 10px;
    overflow: hidden;
  }
  
  .skio-group-topline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    font-size: 16px;
  }
  
  .skio-radio__container {
    display: flex;
    margin-right: 10px;
  }
  
  .skio-radio {
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s cubic-bezier(0.4,0,0.2,1);
    transform-origin: center;
    transform: scale(0);
    opacity: 0;
  }
  .skio-group-label:hover .skio-radio {
    transform: scale(1);
    opacity: 0.75;
  }
  .skio-group-container--selected .skio-group-label .skio-radio {
    transform: scale(1);
    opacity: 1;
  }
  
  .skio-price {
    margin-left: auto;
  }
  
  .skio-group-content {
    width: auto;
    margin-left: 30px;
    transition: max-height 0.25s cubic-bezier(0.4,0,0.2,1),
                opacity 0.25s cubic-bezier(0.4,0,0.2,1);
    max-height: 38px;
    opacity: 1;
  }
  
  /* Hide frequency if not selected */
  .skio-group-container:not(.skio-group-container--selected) .skio-group-content {
    max-height: 0;
    opacity: 0;
    pointer-events: none;
  }
  
  .skio-group-title {
    min-width: max-content;
  }
  
  .skio-save {
    color: #0fa573;
    border: 1px #0fa573 solid; 
    padding: 0px 8px;
    border-radius: 20px;
  }
  
  .skio-frequency {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 30px 8px 10px;
    margin-top: 5px;
    border-radius: 5px;
    background-color: #f7f7f7;
    width: 100%;
    border: 0;
    font-size: 14px;
    white-space: nowrap;
    text-overflow: ellipsis;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E");
    background-position: right 10px top 50%;
    background-size: 18px;
    background-repeat: no-repeat;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }
  .skio-frequency.skio-frequency--one {
    background-image: none;
  }
  
  .skio-frequency span {
    text-transform: lowercase;
  }
`;

class SkioPlanPickerComponent extends LitElement {
  static properties = {
    product: { type: Object },            //required
    productHandle: { type: String },      //optional (unless product isn't passed, then required)
    key: { type: String },                //optional, defaults to product.id; identifier for this instance of the Skio plan picker
    
    formId: { type: String },             //optional; if passed, used to connect input fields to form
    needsFormId: { type: Boolean },       //optional, defaults to false; if true, element needs to be passed a formId, else it searches for a form

    subscriptionFirst: { type: Boolean }, //optional, defaults to false; if true, shows subscription option above onetime
    startSubscription: { type: Boolean }, //optional, defaults to false; if true, auto-selects subscription on page load
    discountFormat: { type: String },     //optional, defaults to percent; can also pass "fixed"
    
    currency: { type: String },           //optional, defaults to 'USD', but can pass any 3 char identifier
    language: { type: String },           //optional, defaults to 'en-US', but can pass any similarly formatted language identifier
    moneyFormatter: {},                   //placeholder for object
  
    selectedVariant: { type: Object },    //placeholder for data
    skioSellingPlanGroups: {},            //placeholder for data
    availableSellingPlanGroups: {},       //placeholder for data
    selectedSellingPlanGroup: {},         //placeholder for data
    selectedSellingPlan: {},              //placeholder for data

    onPlanChange: { type: Function }
  };

  static styles = skioStyles;

  constructor() {
    super();
    this.product = null;
    this.selectedVariant = null;

    this.productHandle = null;

    this.key = null;
    this.formId = null;
    this.needsFormId = false;

    this.skioSellingPlanGroups = null;
    this.availableSellingPlanGroups = null;

    this.selectedSellingPlanGroup = null;
    this.selectedSellingPlan = null;

    this.startSubscription = false;
    this.subscriptionFirst = false;

    this.skioMainProduct = true;

    this.discountFormat = 'percent';

    this.onPlanChange = () => {};

    this.currency = 'USD';
    this.language = 'en-US';
    this.moneyFormatter = new Intl.NumberFormat(this.language, {
      style: 'currency',
      currency: this.currency,
    });
  }

  render() {
    if(!this.product || !this.selectedVariant) return;
    
    return html`
      <fieldset class="skio-plan-picker" skio-plan-picker="${ this.key }">
        <div class="skio-group-container ${ this.product.requiresSellingPlan == false ? 'skio-group-container--available' : '' } ${ this.selectedSellingPlanGroup == null ? 'skio-group-container--selected' : '' } ${ this.subscriptionFirst ? 'skio-onetime-second' : ''}" skio-group-container 
          @click=${() => this.selectSellingPlanGroup(null) } >
        
          <input id="skio-one-time-${ this.key }" class="skio-group-input" name="skio-group-${ this.key }" type="radio" value="" 
            skio-one-time ?checked=${ this.startSubscription == false && this.product.requiresSellingPlan == false ? true : false }>
          <label class="skio-group-label" for="skio-one-time-${ this.key }">
            <div class="skio-group-topline">
              <div class="skio-radio__container">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                  <circle class="skio-radio" cx="12" cy="12" r="7" fill="currentColor"></circle>
                </svg>
              </div>
              <span>One-time</span>
              <div class="skio-price">
                <span skio-onetime-price>${ this.moneyFormatter.format(parseFloat(this.selectedVariant.price.amount)) }</span>
              </div>
            </div>
          </label>
        </div>
        ${ this.availableSellingPlanGroups ? this.availableSellingPlanGroups.map((group, index) => 
          html`
            <div class="skio-group-container skio-group-container--available ${ this.selectedSellingPlanGroup == group ? 'skio-group-container--selected' : '' }" skio-group-container
              @click=${() => this.selectSellingPlanGroup(group) }>
              <input id="skio-selling-plan-group-${ index }-${ this.key }" class="skio-group-input" name="skio-group-${ this.key }"
                type="radio" value="${ group.node.id }" skio-selling-plan-group="${ group.node.id }" ?checked=${ this.selectedSellingPlanGroup == group ? true : false } >
              <label class="skio-group-label" for="skio-selling-plan-group-${ index }-${ this.key }">
                <div class="skio-group-topline">
                  <div class="skio-radio__container">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                      <circle class="skio-radio" cx="12" cy="12" r="7" fill="currentColor"></circle>
                    </svg>
                  </div>
                  <div class="skio-group-title">
                    ${ group.node.name }
                    ${ this.discount(group.node.selected_selling_plan).percent !== '0%' ? html`
                      <span class="skio-save">Save <span skio-discount>${ this.discountFormat == 'percent' ? this.discount(group.node.selected_selling_plan).percent : this.discount(group.node.selected_selling_plan).amount }</span></span>
                    ` : html`` }
                  </div>
                  <div class="skio-price">
                    <span skio-subscription-price>${ this.price(group.node.selected_selling_plan) }</span>
                  </div>
                </div>
                <div class="skio-group-content">
                  <select skio-selling-plans="${ group.node.id }" class="skio-frequency"
                    @change=${ (e) => this.selectSellingPlan(e.target, group) }>
                    ${ group ? group.node.sellingPlans.edges.map((selling_plan) => 
                        html`
                        <option value="${ this.parseSellingPlanId(selling_plan.node.id) }">
                          ${ group.node.name == 'Subscription' ? `Delivery ${ selling_plan.node.name }` : `${ selling_plan.node.name }` }
                        </option>
                        `
                      ): ''}
                  </select>
                </div>
              </label>
            </div>
          `
        ): ''}
      </fieldset>`
  }

  updated = (changed) => {
    if(changed.has('product')) {
      //update key
      this.key = this.product.id.replace("gid://shopify/Product/", "");

      //update skioSellingPlanGroups
      this.skioSellingPlanGroups = this.product.sellingPlanGroups.edges.filter(
        selling_plan_group => selling_plan_group.node.appName === 'SKIO'
      )
    }

    if(changed.has('selectedVariant')) {
      //update availableSellingPlanGroups based on skioSellingPlanGroups and selectedVariant.id
      this.availableSellingPlanGroups = this.skioSellingPlanGroups.filter(selling_plan_group =>
        selling_plan_group.node.sellingPlans.edges.some(selling_plan =>
          this.selectedVariant.sellingPlanAllocations.edges.some(
            selling_plan_allocation => selling_plan_allocation.node.sellingPlan.id === selling_plan.node.id
          )
        )
      )

      //update selectedSellingPlan value
      if (this.availableSellingPlanGroups?.length > 0) {
        //update each group with a default selected_selling_plan
        this.availableSellingPlanGroups.forEach((group => {
          group.node.selected_selling_plan = group.node.sellingPlans.edges[0].node;
        }));

        // If conditions match, set default selling plan group and selling plan
        if(this.startSubscription == true || this.product.requiresSellingPlan == true || this.selectedSellingPlan) {
          this.selectedSellingPlanGroup = this.availableSellingPlanGroups[0];
          this.selectedSellingPlan = this.availableSellingPlanGroups[0].node.selected_selling_plan;
        }
      }

      if(this.selectedVariant.price.currencyCode) {
        this.moneyFormatter = new Intl.NumberFormat(this.language, {
          style: 'currency',
          currency: this.selectedVariant.price.currencyCode
        });
      }
    }

    if (changed.has('selectedSellingPlan')) {
      //update price of price elements if applicable
      document.querySelectorAll(`[skio-price][skio-key="${ this.key }"]`).forEach((el) => {
        el.innerHTML = this.price(this.selectedSellingPlan);
      });
      //update display of external content elements
      document.querySelectorAll(`[skio-onetime-content][skio-key="${ this.key }"]`).forEach((el) => {
        this.selectedSellingPlan !== null ? el.style.display = "none" : el.style.removeProperty('display');
      });
      document.querySelectorAll(`[skio-subscription-content][skio-key="${ this.key }"]`).forEach((el) => {
        this.selectedSellingPlan == null ? el.style.display = "none" : el.style.removeProperty('display');
      });

      //dispatch CustomEvent to tell DOM that this specific plan picker instance was updated, and pass the selectedSellingPlan
      const event = new CustomEvent(`skio:${ this.key }:update-selling-plan`, {bubbles: true, composed: true, detail: this.selectedSellingPlan});
      this.dispatchEvent(event);

      this.onPlanChange(this.selectedSellingPlan ? {
        sellingPlan: this.selectedSellingPlan, 
        price: { 
          amount: String(this.price(this.selectedSellingPlan, false) / 100), 
          currencyCode: this.currency 
        },
        discount: this.discount(this.selectedSellingPlan)
      }: null);
    }
  }
  
  // Update selected selling plan group; called on click of skio-group-container element
  selectSellingPlanGroup(group) {
    this.selectedSellingPlanGroup = group;
    this.selectedSellingPlan = group?.node?.selected_selling_plan;
  }

  // Update selected selling plan; called on change of skio-frequency select element
  selectSellingPlan(element, group) {
    let selling_plan = group.node.sellingPlans.edges.find(x => this.parseSellingPlanId(x.node.id) == element.value);
    if (selling_plan) {
      group.node.selected_selling_plan = selling_plan.node;
      this.selectedSellingPlanGroup = group;
      this.selectedSellingPlan = selling_plan.node;
    }
    else this.log("Skio Plan Picker | Error: couldn't find selling plan with id " + element.value + " for variant " + this.selectedVariant.id + " from product " + this.product.id);
  }

  // Formats integer value into money value
  money(price) {
    return this.moneyFormatter.format(price / 100.0)
  }

  // Calculates discount based on selling_plan.price_adjustments, returns { percent, amount } of selling plan discount
  discount(selling_plan) {
    if (!selling_plan) return { percent: '0%', amount: 0 }

    let selling_plan_allocation = this.selectedVariant.sellingPlanAllocations.edges.find(x => x.node.sellingPlan.id == selling_plan.id);
    if(!selling_plan_allocation) return { percent: '0%', amount: 0 };

    const price_adjustment = selling_plan_allocation.node.priceAdjustments[0];
    const discount = { percent: '0%', amount: 0 }
    const price = parseFloat(this.selectedVariant.price.amount) * 100;

    if(this.subscriptionDiscountOverride) {
      return { 
        percent: this.subscriptionDiscountOverride + '%', 
        amount:  Math.round((price * this.subscriptionDiscountOverride) / 100.0)
      }
    }

    discount.percent = `${ Math.round((1 - (parseFloat(price_adjustment.price.amount) / parseFloat(price_adjustment.compareAtPrice.amount))) * 100) }%`
    discount.amount = (parseFloat(price_adjustment.compareAtPrice.amount) - parseFloat(price_adjustment.price.amount)) * 100
    
    return discount
  }

  // Calculates the variant's price for the given selling plan, returns a formatted money value (if desired)
  price(selling_plan, formatted = true) {
    return formatted
      ? this.money((parseFloat(this.selectedVariant.price.amount) * 100) - this.discount(selling_plan).amount)
      : (parseFloat(this.selectedVariant.price.amount) * 100) - this.discount(selling_plan).amount
  }

  parseSellingPlanId(sellingPlanId) {
    return sellingPlanId.replace("gid://shopify/SellingPlan/","");
  }
}

customElements.define('skio-plan-picker', SkioPlanPickerComponent)

export default createComponent({
  react: React, 
  tagName: 'skio-plan-picker', 
  elementClass: SkioPlanPickerComponent
})