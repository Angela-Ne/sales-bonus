/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции

   const { discount, sale_price, quantity } = purchase;


   const decimalDiscount = discount / 100;

   const fullPrice = sale_price * quantity;


   const revenue = fullPrice * (1 - decimalDiscount);

   return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
   // @TODO: Расчет бонуса от позиции в рейтинге

   const { profit } = seller;

   if (index === 0) {

      return 15;
   } else if (index === 1 || index === 2) {
      return 10;
   } else if (index === total - 1) {
      return 0;
   } else {
      return 5;
   }

}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
//function analyzeSalesData(data, options) {
// @TODO: Проверка входных данных

// @TODO: Проверка наличия опций

// @TODO: Подготовка промежуточных данных для сбора статистики

// @TODO: Индексация продавцов и товаров для быстрого доступа

// @TODO: Расчет выручки и прибыли для каждого продавца

// @TODO: Сортировка продавцов по прибыли

// @TODO: Назначение премий на основе ранжирования

// @TODO: Подготовка итоговой коллекции с нужными полями


function analyzeSalesData(data, options) {
   // Здесь проверим входящие данные
   if (!data

      || !options
      || !Array.isArray(data.sellers)
      || !Array.isArray(data.products)
      || !Array.isArray(data.purchase_records)
      || data.products.length === 0
      || data.sellers.length === 0
      || data.purchase_records.length === 0) {
      throw new Error('Некорректные входные данные');
   }
   if (typeof options !== "object" || options === null) {
      throw new Error('Опции должны быть объектом');
   }

   const { calculateRevenue, calculateBonus } = options;

   if (typeof calculateRevenue !== "function") {
      throw new Error('calculateRevenue должна быть функцией');
   }

   if (typeof calculateBonus !== "function") {
      throw new Error('calculateBonus должна быть функцией')
   }

   const sellerStats = data.sellers.map(seller => ({

      seller_id: seller.id,
      seller_name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      top_products: [],
      bonus_amount: 0

   }));

   // Здесь посчитаем промежуточные данные и отсортируем продавцов
   const sellersProfit = {};


   const sellerIndex = sellerStats.reduce((acc, seller) => {
      return { ...acc, [seller.seller_id]: seller };
   }, {});

   const productIndex = data.products.reduce((acc, product) => {

      return { ...acc, [product.sku]: product };
   }, {});


   // Проходим по всем чекам и считаем выручку для каждого продавца

   data.purchase_records.forEach(record => {
      const seller = sellerIndex[record.seller_id];

      if (seller) {

         seller.sales_count++;

         seller.revenue += record.total_amount

         let total_amount = 0;
         let total_cost = 0;


         record.items.forEach(item => {
            const product = productIndex[item.sku];

            if (product) {

               const cost = product.purchase_price * item.quantity;

               const revenue = options.calculateRevenue(item, product);

               const profit = revenue - cost;


               seller.profit = (seller.profit || 0) + profit;

               total_amount += revenue;
               total_cost += cost;



               if (!seller.products_sold) {
                  seller.products_sold = {};
               }
               if (!seller.products_sold[item.sku]) {
                  seller.products_sold[item.sku] = 0;
               }

               seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + item.quantity;
            }
         });


      }

   });

   sellerStats.sort((a, b) => b.profit - a.profit);
   // const sortedSellerStats = sellerStats.toSorted((a, b) => b.profit - a.profit);

   sellerStats.forEach((seller, index) => {

      seller.bonus = options.calculateBonus(index, sellerStats.length, seller);


      if (seller.products_sold) {

         const productsArray = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

         seller.top_products = productsArray;
      } else {
         seller.top_products = [];
      }
   });


   sellerStats.forEach((seller, index) => {

      seller.bonus_percent = options.calculateBonus(index, sellerStats.length, seller);
      seller.bonus_amount = (seller.profit * seller.bonus_percent) / 100;


      seller.top_products = Object.entries(seller.products_sold || {})
         .map(([sku, quantity]) => ({ sku, quantity }))
         .sort((a, b) => b.quantity - a.quantity)
         .slice(0, 10);
   });


   return sellerStats.map(seller => ({
      seller_id: seller.seller_id,
      name: seller.seller_name,
      revenue: seller.revenue.toFixed(2),
      profit: +seller.profit.toFixed(2),
      sales_count: seller.sales_count,
      top_products: seller.top_products,
      bonus: +seller.bonus_amount.toFixed(2)
   }));

}