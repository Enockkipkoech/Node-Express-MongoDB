class APIFeatures {
    constructor(query, queryString){
      this.query = query;
      this.queryString = queryString
    }
  
    //filtering
    filter(){
      const queryObj = {...this.queryString};
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      excludedFields.forEach(el => delete queryObj[el]); 
         
      //const query = Tour.find().where('duration').equals(5).where('difficulty').equals('easy');      
      
      // 1b) Advanced Filtering     
      let queryStr = JSON.stringify(queryObj);   
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, match => `$${match}`);          
     
      this.query = this.query.find(JSON.parse(queryStr));  
      
      return this;
    }
  
   //Sorting
    sort(){
      
       if(this.queryString.sort){
        const sortBy = this.queryString.sort.split(',').join(' ');
        this.query =this.query.sort(sortBy);
      }else {
        this.query = this.query.sort('-createdAt');
      }
      return this;
    }
  // Fields Limiting
    limitFields(){    
      if(this.queryString.fields){
        const fields = this.queryString.fields.split(',').join(' ')
        this.query = this.query.select(fields)
      } else{
        this.query = this.query.select('-__v')
      }
      return this
    }
  
   //Pagination
    paginate(){    
     
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;    
      const skip = (page - 1) * limit
     this.query = this.query.skip(skip).limit(limit);
      
      return this;
    }
  }

  module.exports = APIFeatures;