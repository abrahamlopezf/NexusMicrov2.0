class APIFeatures {
    constructor(queryOptions, queryString) {
        this.queryOptions = queryOptions;
        this.queryString = queryString;
    }

    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 20;
        const offset = (page - 1) * limit;

        this.queryOptions.limit = limit;
        this.queryOptions.offset = offset;

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').map(field => {
                return field.startsWith('-') ? [field.substring(1), 'DESC'] : [field, 'ASC'];
            });
            this.queryOptions.order = sortBy;
        } else {
            this.queryOptions.order = [['created_at', 'DESC']]; // default fallback
        }

        return this;
    }
}

module.exports = APIFeatures;
