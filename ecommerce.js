const express = require("express");
const mysql = require("mysql");
const cors= require("cors")
const app = express();
const pluralize=require('pluralize')
const axios = require('axios');
const port = 4000;
const ejs = require('ejs');
app.use(cors({
  origin:"*"
}))

// connecting mySql
const connection = mysql.createConnection({
  host: "sql6.freesqldatabase.com",
  user: "sql6685162",
  password: "D5LmRv2Ibg",
  database: "sql6685162",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database: " + err.stack);
    return;
  }
  console.log("Connected to MySQL database as id " + connection.threadId);
});

function singularizeWord(word) {
  const words = word.split(/\s+/); 
  const singularizedWords = words.map((word) => pluralize.singular(word)); 
  const singularizedString = singularizedWords.join(" "); 
  return singularizedString;
}

app.get("/", (req, res) => {
  // res.render('welcome',{});
  res.send("Hello, User If u want category /product section just type localhost/3000/category like wise You Want...");
}); 

app.get('/search_page', async (req, res) => {
  try {
    var searchQuery = req.query.q || '*';
    searchQuery=singularizeWord(searchQuery);
    const isSentence = /\s/.test(searchQuery);
    const containsNumber = /\d/.test(searchQuery);
    // initialize the required parameters
    let brandFilter = '';
    let productNameFilter = '';
    let minPriceFilter = '';
    let categoryFilter='';
    let maxPriceFilter=" "
    if (containsNumber) {
    // Extract brand, product, and price information using a regular expression
    const match = searchQuery.match(/(\D+)(\d+)$/);
    //console.log(match[1].split(" ").length)
    //console.log(match[0].length)
    console.log(match)

       if (match && match.length === 3 && match[1].split(" ").length===4) {
      const brandAndProduct = match[1].trim();
      const mrp = match[2].trim();
      console.log(mrp)
      var [brand, product_name,specification] = brandAndProduct.split(/\s+/);
      console.log(product_name)   
      if(product_name=='tshirt'){
        product_name="t-shirts"
        productNameFilter = ` OR product_name:${encodeURIComponent(product_name)}`;
      }
      else{
        productNameFilter = ` OR product_name:${encodeURIComponent(product_name)}*`;
      }
      console.log(specification)  
      // product_name[0] = product_name[0].substring(0,product_name[0].length-2);
      if (specification === 'under' || specification === 'less' || specification === 'less than' || specification === 'within'|| specification=='below') {
        minPriceFilter = ` AND mrp:[* TO ${mrp}]`;
      }
    
    if (specification === 'more' || specification === 'more than' || specification === 'over' || specification === 'from' || specification === 'above') {
        minPriceFilter = ` AND mrp:[${mrp} TO *]`;
    }
       
    if(specification==='in' || specification=='on'){
      minPriceFilter=` AND mrp:${mrp}`
    }
    
      brandFilter = `(brand:${encodeURIComponent(brand)}*`;
      
      categoryFilter= ` OR category_name:${encodeURIComponent(brand)}*)`
   
  } 
  else if(match[0].split(" ").length>4){
    console.log("iam")
    let c=match[0].split(' ')
    brandFilter=`(brand:${encodeURIComponent(c[0])}*`
    productNameFilter = ` OR product_name:*${encodeURIComponent(c[2])}*)`;
    //console.log(productNameFilter)
    if (c[3] === 'under' || c[3] === 'less' || c[3] === 'less than' || c[3] === 'within' ||c[3]=='below') {
      minPriceFilter = ` AND mrp:[* TO ${c[4]}]`;
    }
  
  if (c[3] === 'more' || c[3] === 'more than' || c[3] === 'over' || c[3] === 'from' || c[3]=== 'above') {
      minPriceFilter = ` AND mrp:[${c[4]} TO *]`;
  }
     
  if(c[3]==='in' || c[3]=='on'){
    minPriceFilter=` AND mrp:${c[4]}`
  }
        }
  
  else{
    console.log("iam two with num")
    console.log(match[1])
    var brandOrProduct = match[1].trim();
    var [brandOrproduct_name,specification] = brandOrProduct.split(/\s+/);
    if(brandOrproduct_name=='tshirt'){
      brandOrproduct_name="t-shirt";
    }
    //if(brandOrproduct_name[0].charAt(brandOrproduct_name[0].length-1)=='s') brandOrproduct_name[0] = brandOrproduct_name[0].substring(0,brandOrproduct_name[0].length-2);
    //productNameFilter = ` OR product_name:*${encodeURIComponent(product_name)}*`;
    console.log(specification)
    categoryFilter=` OR category_name:${brandOrproduct_name}*)`
    const mrp = match[2].trim();
   // console.log(mrp)
    if (specification === 'under' || specification === 'less' || specification === 'less than' || specification === 'within' || specification=='below') {
      minPriceFilter = ` AND mrp:[* TO ${mrp}]`;
    }
   
    if (specification === 'more' || specification === 'more than' || specification === 'over' || specification === 'from' || specification === 'above') {
      minPriceFilter = ` AND mrp:[${mrp} TO *]`;
    }
    
    if(specification==='in' || specification=='on'){
      minPriceFilter=`AND mrp:${mrp}`
    }
     
      brandFilter = `(brand:${encodeURIComponent(brandOrproduct_name)}*`;
      productNameFilter = ` OR product_name:${encodeURIComponent(brandOrproduct_name)}`
      //categoryFilter=` OR category_name:${encodeURIComponent(brandOrproduct_name)}`
  }

} 

else if(isSentence) {
  var [brand,...product_name] = searchQuery.split(/\s+/);
  console.log(product_name)
  if(product_name[0]=='tshirt'){
    product_name='t-shirt';
  }
  //console.log(brand)   
  categoryFilter=` OR category_name:*${encodeURIComponent(brand)}*`
  brandFilter = `brand:*${encodeURIComponent(brand)}*`;
  productNameFilter = ` OR product_name:${encodeURIComponent(product_name)}`;
  //console.log(productNameFilter);
  if(product_name[0]=='from' || product_name[0]=='in'){
    console.log("entered");
    brand=(brand==="tshirt")?'t-shirt':'shirt';
    brandFilter = `(brand:${encodeURIComponent(product_name)}`;
    productNameFilter = ` OR product_name:${encodeURIComponent(brand)})`;
    categoryFilter= ` OR category_name:${encodeURIComponent(product_name)}*`;
  }
  console.error('No number in the query');
}
else{
  console.log("i am single")
  if(searchQuery=='tshirt'){
   searchQuery="t-shirt";
  }
  brandFilter = `(brand:*${encodeURIComponent(searchQuery)}*`;
  productNameFilter = ` OR product_name:${encodeURIComponent(searchQuery)} `;
  categoryFilter= `OR category_name:${encodeURIComponent(searchQuery)}*)`;
}

const solr_host = process.env.SOLR_HOST || '192.168.177.216'

const solrQuery = `http://${solr_host}:8983/solr/Ecommerce/select?q=${brandFilter}${productNameFilter}${categoryFilter}${minPriceFilter}${maxPriceFilter}&rows=1000`;
console.log(solrQuery);

console.log('Solr Query:', solrQuery);
    const response = await axios.get(solrQuery);
    const searchResults = response.data.response.docs;
    res.json(searchResults);
    
  } catch (error) {
    console.error('Error performing Solr query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//app.set('view engine', 'ejs'); 

app.get('/category_page', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  //console.log(page);
  const itemsPerPage = parseInt(req.query.itemsPerPage) || 5;
  //console.log(page)
  const offset = (page - 1) * itemsPerPage;

  const totalCountQuery = 'SELECT COUNT(*) AS total FROM category';
  connection.query(totalCountQuery, (error, totalCountResult) => {
    if (error) {
      console.error('Error getting total row count: ' + error.stack);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    
    const totalRows = totalCountResult[0].total;
    //console.log(totalRows)
    const totalPages = Math.ceil(totalRows / itemsPerPage);

    const query = `SELECT * FROM category LIMIT ${itemsPerPage} OFFSET ${offset}`;
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing MySQL query: ' + error.stack);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
        res.json({
        results: results,
        page: page,
        totalPages: totalPages,
        itemsPerPage
      });
    });
  });
});
 
app.get("/products_page", (req, res) => {
  const categoryId = req.query.cid || 'all';
  const itemsPerPage = parseInt(req.query.itemsPerPage) || 10; // Default to 5 items per page
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * itemsPerPage;

  const allCname = "SELECT * FROM category";
  connection.query(allCname, (err, categories) => {
    if (err) {
      console.error("Error executing MySQL query: " + categoryError.stack);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (categoryId === "all") {
      const totalCountQuery = "SELECT COUNT(*) AS count FROM products";
      const query = "SELECT * FROM products LIMIT ? OFFSET ?";
      
      connection.query(totalCountQuery, (error, countResult) => {
        if (error) {
          console.error("Error executing count MySQL query: " + error.stack);
          res.status(500).json({ error: "Internal server error" });
          return;
        }

        const totalCount = countResult[0].count;
        const totalPages = Math.ceil(totalCount / itemsPerPage);

        connection.query(query, [itemsPerPage, offset], (err, results) => {
          if (err) {
            console.error("Error executing MySQL query: " + err.stack);
            res.status(500).json({ error: "Internal server error" });
            return;
          }

          res.json({
            products: results,
            categoryId,
            page,
            totalPages,
            itemsPerPage,
            categories
          });

        });
      });
    } else {
      const countQuery = "SELECT COUNT(*) AS count FROM products WHERE cid = ?";
      const query = "SELECT * FROM products WHERE cid = ? LIMIT ? OFFSET ?";
      
      connection.query(countQuery, [categoryId], (error, countResult) => {
        if (error) {
          console.error("Error executing count MySQL query: " + error.stack);
          res.status(500).json({ error: "Internal server error" });
          return;
        }

        const totalCount = countResult[0].count;
        const totalPages = Math.ceil(totalCount / itemsPerPage);

        connection.query(query, [categoryId, itemsPerPage, offset], (error, results) => {
          if (error) {
            console.error("Error executing MySQL query: " + error.stack);
            res.status(500).json({ error: "Internal server error" });
            return;
          }
          console.log("200");
          res.json({
            products: results,
            categoryId,
            page,
            totalPages,
            itemsPerPage,
            categories
          });
    
        });
      });
    }
  });
});

app.listen(port, "0.0.0.0",() => {
  console.log(`Server listening at http://localhost:${port}`);
});

// app.get("/search",(req,res)=>{
//   res.sendFile(__dirname+"/search.html");
// });
// app.get("/category",(req,res)=>{
//   res.sendFile(__dirname+"/category.html");
// });
// app.get("/products",(req,res)=>{
//   res.sendFile(__dirname+"/products.html");
// });

