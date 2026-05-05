--
-- PostgreSQL database dump
--

\restrict 9Xu7DwrJKFUOfU6GOQBEusd7vXLaoIRWyoQeKoS9zJ3haxMqEDd8AGkoHLgSSm5

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-19 20:25:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 18295)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 18296)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 920 (class 1247 OID 18360)
-- Name: account_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.account_type AS ENUM (
    'CAJA',
    'BANCO'
);


ALTER TYPE public.account_type OWNER TO postgres;

--
-- TOC entry 917 (class 1247 OID 18348)
-- Name: inventory_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inventory_type AS ENUM (
    'ENTRADA_COMPRA',
    'SALIDA_PRODUCCION',
    'SALIDA_VENTA',
    'AJUSTE',
    'DEVOLUCION'
);


ALTER TYPE public.inventory_type OWNER TO postgres;

--
-- TOC entry 914 (class 1247 OID 18340)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'EFECTIVO',
    'TARJETA',
    'TRANSFERENCIA'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- TOC entry 923 (class 1247 OID 18366)
-- Name: production_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.production_status AS ENUM (
    'PENDIENTE',
    'ASIGNADA',
    'EN_PROCESO',
    'TERMINADA',
    'ENTREGADA'
);


ALTER TYPE public.production_status OWNER TO postgres;

--
-- TOC entry 911 (class 1247 OID 18328)
-- Name: quote_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.quote_status AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CONVERTED'
);


ALTER TYPE public.quote_status OWNER TO postgres;

--
-- TOC entry 908 (class 1247 OID 18318)
-- Name: sale_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sale_status AS ENUM (
    'PENDIENTE',
    'EN_PRODUCCION',
    'LISTO_ENTREGA',
    'PAGADO'
);


ALTER TYPE public.sale_status OWNER TO postgres;

--
-- TOC entry 905 (class 1247 OID 18308)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'VENTAS',
    'PRODUCCION',
    'FINANZAS'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 272 (class 1255 OID 18806)
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 255 (class 1259 OID 18720)
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type public.account_type NOT NULL,
    balance numeric(14,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 18719)
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNER TO postgres;

--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 254
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- TOC entry 261 (class 1259 OID 18778)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id bigint NOT NULL,
    action character varying(20) NOT NULL,
    old_data jsonb,
    new_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 18777)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 260
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 223 (class 1259 OID 18397)
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    rfc character varying(50),
    phone character varying(20),
    email character varying(150),
    address text,
    credit_days integer DEFAULT 0,
    loyalty_points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 18396)
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 222
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- TOC entry 225 (class 1259 OID 18412)
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    phone character varying(20),
    role character varying(100),
    area character varying(100),
    salary_type character varying(50),
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 18411)
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- TOC entry 5379 (class 0 OID 0)
-- Dependencies: 224
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- TOC entry 259 (class 1259 OID 18757)
-- Name: financial_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_movements (
    id bigint NOT NULL,
    account_id integer NOT NULL,
    type character varying(20) NOT NULL,
    concept text NOT NULL,
    amount numeric(12,2) NOT NULL,
    reference_type character varying(50),
    reference_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT financial_movements_type_check CHECK (((type)::text = ANY ((ARRAY['INGRESO'::character varying, 'EGRESO'::character varying])::text[])))
);


ALTER TABLE public.financial_movements OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 18756)
-- Name: financial_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_movements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_movements_id_seq OWNER TO postgres;

--
-- TOC entry 5380 (class 0 OID 0)
-- Dependencies: 258
-- Name: financial_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_movements_id_seq OWNED BY public.financial_movements.id;


--
-- TOC entry 235 (class 1259 OID 18499)
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_movements (
    id bigint NOT NULL,
    material_id integer NOT NULL,
    type public.inventory_type NOT NULL,
    quantity numeric(10,4) NOT NULL,
    unit_cost numeric(12,2),
    reference_type character varying(50),
    reference_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_movements OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 18498)
-- Name: inventory_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_movements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_movements_id_seq OWNER TO postgres;

--
-- TOC entry 5381 (class 0 OID 0)
-- Dependencies: 234
-- Name: inventory_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_movements_id_seq OWNED BY public.inventory_movements.id;


--
-- TOC entry 229 (class 1259 OID 18437)
-- Name: materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    category character varying(100),
    type character varying(20) DEFAULT 'FIJO'::character varying,
    unit character varying(50) NOT NULL,
    current_stock numeric(10,4) DEFAULT 0,
    min_stock numeric(10,4) DEFAULT 0,
    cost numeric(12,2),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT materials_current_stock_check CHECK ((current_stock >= (0)::numeric)),
    CONSTRAINT materials_type_check CHECK (((type)::text = ANY ((ARRAY['FIJO'::character varying, 'ROTATIVO'::character varying])::text[])))
);


ALTER TABLE public.materials OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 18436)
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.materials_id_seq OWNER TO postgres;

--
-- TOC entry 5382 (class 0 OID 0)
-- Dependencies: 228
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- TOC entry 257 (class 1259 OID 18733)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    sale_id integer NOT NULL,
    account_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 18732)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- TOC entry 5383 (class 0 OID 0)
-- Dependencies: 256
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 237 (class 1259 OID 18516)
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_rules (
    id integer NOT NULL,
    operation_cost_percent numeric(5,2) NOT NULL,
    profit_margin_percent numeric(5,2) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pricing_rules OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 18515)
-- Name: pricing_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pricing_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pricing_rules_id_seq OWNER TO postgres;

--
-- TOC entry 5384 (class 0 OID 0)
-- Dependencies: 236
-- Name: pricing_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pricing_rules_id_seq OWNED BY public.pricing_rules.id;


--
-- TOC entry 233 (class 1259 OID 18473)
-- Name: product_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_materials (
    id integer NOT NULL,
    product_id integer NOT NULL,
    material_id integer NOT NULL,
    type character varying(20) DEFAULT 'FIJO'::character varying,
    quantity numeric(10,4) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT product_materials_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT product_materials_type_check CHECK (((type)::text = ANY ((ARRAY['FIJO'::character varying, 'OPCIONAL'::character varying])::text[])))
);


ALTER TABLE public.product_materials OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 18472)
-- Name: product_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_materials_id_seq OWNER TO postgres;

--
-- TOC entry 5385 (class 0 OID 0)
-- Dependencies: 232
-- Name: product_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_materials_id_seq OWNED BY public.product_materials.id;


--
-- TOC entry 249 (class 1259 OID 18655)
-- Name: production_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_tasks (
    id bigint NOT NULL,
    work_order_id integer NOT NULL,
    employee_id integer,
    task_name character varying(150) NOT NULL,
    status character varying(50) DEFAULT 'PENDIENTE'::character varying,
    price numeric(12,2),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.production_tasks OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 18654)
-- Name: production_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.production_tasks_id_seq OWNER TO postgres;

--
-- TOC entry 5386 (class 0 OID 0)
-- Dependencies: 248
-- Name: production_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_tasks_id_seq OWNED BY public.production_tasks.id;


--
-- TOC entry 231 (class 1259 OID 18457)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    category character varying(100),
    base_price numeric(12,2) DEFAULT 0,
    base_cost numeric(12,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 18456)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 5387 (class 0 OID 0)
-- Dependencies: 230
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 253 (class 1259 OID 18696)
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_items (
    id bigint NOT NULL,
    purchase_order_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity numeric(10,4) NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchase_items OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 18695)
-- Name: purchase_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_items_id_seq OWNER TO postgres;

--
-- TOC entry 5388 (class 0 OID 0)
-- Dependencies: 252
-- Name: purchase_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_items_id_seq OWNED BY public.purchase_items.id;


--
-- TOC entry 251 (class 1259 OID 18678)
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    supplier_id integer NOT NULL,
    status character varying(50) DEFAULT 'PENDIENTE'::character varying,
    total numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 18677)
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_id_seq OWNER TO postgres;

--
-- TOC entry 5389 (class 0 OID 0)
-- Dependencies: 250
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- TOC entry 241 (class 1259 OID 18552)
-- Name: quote_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quote_items (
    id bigint NOT NULL,
    quote_id integer NOT NULL,
    product_id integer NOT NULL,
    description text,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    discount numeric(12,2) DEFAULT 0,
    surcharge numeric(12,2) DEFAULT 0,
    total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quote_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.quote_items OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 18551)
-- Name: quote_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quote_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quote_items_id_seq OWNER TO postgres;

--
-- TOC entry 5390 (class 0 OID 0)
-- Dependencies: 240
-- Name: quote_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quote_items_id_seq OWNED BY public.quote_items.id;


--
-- TOC entry 239 (class 1259 OID 18529)
-- Name: quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotes (
    id integer NOT NULL,
    quote_number character varying(50) NOT NULL,
    client_id integer NOT NULL,
    status public.quote_status DEFAULT 'DRAFT'::public.quote_status,
    subtotal numeric(12,2) DEFAULT 0,
    discount numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 18528)
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotes_id_seq OWNER TO postgres;

--
-- TOC entry 5391 (class 0 OID 0)
-- Dependencies: 238
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;


--
-- TOC entry 245 (class 1259 OID 18610)
-- Name: sale_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_items (
    id bigint NOT NULL,
    sale_id integer NOT NULL,
    product_id integer NOT NULL,
    description text,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sale_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.sale_items OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 18609)
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_items_id_seq OWNER TO postgres;

--
-- TOC entry 5392 (class 0 OID 0)
-- Dependencies: 244
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- TOC entry 243 (class 1259 OID 18582)
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    sale_number character varying(50) NOT NULL,
    client_id integer NOT NULL,
    quote_id integer,
    status public.sale_status DEFAULT 'PENDIENTE'::public.sale_status,
    total numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0,
    balance numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 18581)
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_seq OWNER TO postgres;

--
-- TOC entry 5393 (class 0 OID 0)
-- Dependencies: 242
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- TOC entry 227 (class 1259 OID 18424)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    phone character varying(20),
    email character varying(150),
    address text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 18423)
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- TOC entry 5394 (class 0 OID 0)
-- Dependencies: 226
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- TOC entry 221 (class 1259 OID 18378)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    password text NOT NULL,
    role public.user_role NOT NULL,
    active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 18377)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5395 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 247 (class 1259 OID 18638)
-- Name: work_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_orders (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    status public.production_status DEFAULT 'PENDIENTE'::public.production_status,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    due_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.work_orders OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 18637)
-- Name: work_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_orders_id_seq OWNER TO postgres;

--
-- TOC entry 5396 (class 0 OID 0)
-- Dependencies: 246
-- Name: work_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_orders_id_seq OWNED BY public.work_orders.id;


--
-- TOC entry 5063 (class 2604 OID 18723)
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- TOC entry 5071 (class 2604 OID 18781)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 4993 (class 2604 OID 18400)
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- TOC entry 4998 (class 2604 OID 18415)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- TOC entry 5069 (class 2604 OID 18760)
-- Name: financial_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_movements ALTER COLUMN id SET DEFAULT nextval('public.financial_movements_id_seq'::regclass);


--
-- TOC entry 5022 (class 2604 OID 18502)
-- Name: inventory_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements ALTER COLUMN id SET DEFAULT nextval('public.inventory_movements_id_seq'::regclass);


--
-- TOC entry 5005 (class 2604 OID 18440)
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- TOC entry 5067 (class 2604 OID 18736)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 5024 (class 2604 OID 18519)
-- Name: pricing_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules ALTER COLUMN id SET DEFAULT nextval('public.pricing_rules_id_seq'::regclass);


--
-- TOC entry 5018 (class 2604 OID 18476)
-- Name: product_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_materials ALTER COLUMN id SET DEFAULT nextval('public.product_materials_id_seq'::regclass);


--
-- TOC entry 5052 (class 2604 OID 18658)
-- Name: production_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_tasks ALTER COLUMN id SET DEFAULT nextval('public.production_tasks_id_seq'::regclass);


--
-- TOC entry 5012 (class 2604 OID 18460)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 5061 (class 2604 OID 18699)
-- Name: purchase_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_items_id_seq'::regclass);


--
-- TOC entry 5056 (class 2604 OID 18681)
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- TOC entry 5035 (class 2604 OID 18555)
-- Name: quote_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items ALTER COLUMN id SET DEFAULT nextval('public.quote_items_id_seq'::regclass);


--
-- TOC entry 5028 (class 2604 OID 18532)
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);


--
-- TOC entry 5045 (class 2604 OID 18613)
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- TOC entry 5040 (class 2604 OID 18585)
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- TOC entry 5002 (class 2604 OID 18427)
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 4989 (class 2604 OID 18381)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5048 (class 2604 OID 18641)
-- Name: work_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders ALTER COLUMN id SET DEFAULT nextval('public.work_orders_id_seq'::regclass);


--
-- TOC entry 5361 (class 0 OID 18720)
-- Dependencies: 255
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, name, type, balance, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5367 (class 0 OID 18778)
-- Dependencies: 261
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, table_name, record_id, action, old_data, new_data, created_at) FROM stdin;
\.


--
-- TOC entry 5329 (class 0 OID 18397)
-- Dependencies: 223
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, name, rfc, phone, email, address, credit_days, loyalty_points, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5331 (class 0 OID 18412)
-- Dependencies: 225
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, name, phone, role, area, salary_type, active, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5365 (class 0 OID 18757)
-- Dependencies: 259
-- Data for Name: financial_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_movements (id, account_id, type, concept, amount, reference_type, reference_id, created_at) FROM stdin;
\.


--
-- TOC entry 5341 (class 0 OID 18499)
-- Dependencies: 235
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_movements (id, material_id, type, quantity, unit_cost, reference_type, reference_id, created_at) FROM stdin;
\.


--
-- TOC entry 5335 (class 0 OID 18437)
-- Dependencies: 229
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materials (id, name, description, category, type, unit, current_stock, min_stock, cost, is_active, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5363 (class 0 OID 18733)
-- Dependencies: 257
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, sale_id, account_id, amount, payment_method, created_at) FROM stdin;
\.


--
-- TOC entry 5343 (class 0 OID 18516)
-- Dependencies: 237
-- Data for Name: pricing_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pricing_rules (id, operation_cost_percent, profit_margin_percent, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5339 (class 0 OID 18473)
-- Dependencies: 233
-- Data for Name: product_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_materials (id, product_id, material_id, type, quantity, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5355 (class 0 OID 18655)
-- Dependencies: 249
-- Data for Name: production_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.production_tasks (id, work_order_id, employee_id, task_name, status, price, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5337 (class 0 OID 18457)
-- Dependencies: 231
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, category, base_price, base_cost, is_active, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5359 (class 0 OID 18696)
-- Dependencies: 253
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_items (id, purchase_order_id, material_id, quantity, unit_cost, total, created_at) FROM stdin;
\.


--
-- TOC entry 5357 (class 0 OID 18678)
-- Dependencies: 251
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_orders (id, supplier_id, status, total, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5347 (class 0 OID 18552)
-- Dependencies: 241
-- Data for Name: quote_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quote_items (id, quote_id, product_id, description, quantity, unit_price, discount, surcharge, total, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5345 (class 0 OID 18529)
-- Dependencies: 239
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotes (id, quote_number, client_id, status, subtotal, discount, total, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5351 (class 0 OID 18610)
-- Dependencies: 245
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_items (id, sale_id, product_id, description, quantity, unit_price, total, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5349 (class 0 OID 18582)
-- Dependencies: 243
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id, sale_number, client_id, quote_id, status, total, paid_amount, balance, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5333 (class 0 OID 18424)
-- Dependencies: 227
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, name, phone, email, address, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5327 (class 0 OID 18378)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, active, last_login, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5353 (class 0 OID 18638)
-- Dependencies: 247
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_orders (id, sale_id, status, start_date, end_date, due_date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5397 (class 0 OID 0)
-- Dependencies: 254
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_id_seq', 1, false);


--
-- TOC entry 5398 (class 0 OID 0)
-- Dependencies: 260
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- TOC entry 5399 (class 0 OID 0)
-- Dependencies: 222
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 1, false);


--
-- TOC entry 5400 (class 0 OID 0)
-- Dependencies: 224
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 1, false);


--
-- TOC entry 5401 (class 0 OID 0)
-- Dependencies: 258
-- Name: financial_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financial_movements_id_seq', 1, false);


--
-- TOC entry 5402 (class 0 OID 0)
-- Dependencies: 234
-- Name: inventory_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_movements_id_seq', 1, false);


--
-- TOC entry 5403 (class 0 OID 0)
-- Dependencies: 228
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.materials_id_seq', 1, false);


--
-- TOC entry 5404 (class 0 OID 0)
-- Dependencies: 256
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- TOC entry 5405 (class 0 OID 0)
-- Dependencies: 236
-- Name: pricing_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pricing_rules_id_seq', 1, false);


--
-- TOC entry 5406 (class 0 OID 0)
-- Dependencies: 232
-- Name: product_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_materials_id_seq', 1, false);


--
-- TOC entry 5407 (class 0 OID 0)
-- Dependencies: 248
-- Name: production_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.production_tasks_id_seq', 1, false);


--
-- TOC entry 5408 (class 0 OID 0)
-- Dependencies: 230
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 1, false);


--
-- TOC entry 5409 (class 0 OID 0)
-- Dependencies: 252
-- Name: purchase_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_items_id_seq', 1, false);


--
-- TOC entry 5410 (class 0 OID 0)
-- Dependencies: 250
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, false);


--
-- TOC entry 5411 (class 0 OID 0)
-- Dependencies: 240
-- Name: quote_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quote_items_id_seq', 1, false);


--
-- TOC entry 5412 (class 0 OID 0)
-- Dependencies: 238
-- Name: quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotes_id_seq', 1, false);


--
-- TOC entry 5413 (class 0 OID 0)
-- Dependencies: 244
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 1, false);


--
-- TOC entry 5414 (class 0 OID 0)
-- Dependencies: 242
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_id_seq', 1, false);


--
-- TOC entry 5415 (class 0 OID 0)
-- Dependencies: 226
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, false);


--
-- TOC entry 5416 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 5417 (class 0 OID 0)
-- Dependencies: 246
-- Name: work_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_orders_id_seq', 1, false);


--
-- TOC entry 5134 (class 2606 OID 18731)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5142 (class 2606 OID 18790)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5086 (class 2606 OID 18410)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- TOC entry 5088 (class 2606 OID 18422)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 5139 (class 2606 OID 18771)
-- Name: financial_movements financial_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_movements
    ADD CONSTRAINT financial_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 5102 (class 2606 OID 18509)
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 5092 (class 2606 OID 18455)
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- TOC entry 5137 (class 2606 OID 18745)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5104 (class 2606 OID 18527)
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 5098 (class 2606 OID 18487)
-- Name: product_materials product_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_materials
    ADD CONSTRAINT product_materials_pkey PRIMARY KEY (id);


--
-- TOC entry 5128 (class 2606 OID 18666)
-- Name: production_tasks production_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5094 (class 2606 OID 18471)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 5132 (class 2606 OID 18708)
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5130 (class 2606 OID 18689)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5112 (class 2606 OID 18570)
-- Name: quote_items quote_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5107 (class 2606 OID 18543)
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- TOC entry 5109 (class 2606 OID 18545)
-- Name: quotes quotes_quote_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_quote_number_key UNIQUE (quote_number);


--
-- TOC entry 5121 (class 2606 OID 18626)
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 18596)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 5119 (class 2606 OID 18598)
-- Name: sales sales_sale_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_sale_number_key UNIQUE (sale_number);


--
-- TOC entry 5090 (class 2606 OID 18435)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 5082 (class 2606 OID 18395)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5084 (class 2606 OID 18393)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 2606 OID 18648)
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5143 (class 1259 OID 18805)
-- Name: idx_audit_table_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_table_record ON public.audit_logs USING btree (table_name, record_id);


--
-- TOC entry 5140 (class 1259 OID 18804)
-- Name: idx_finance_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finance_account ON public.financial_movements USING btree (account_id);


--
-- TOC entry 5099 (class 1259 OID 18796)
-- Name: idx_inv_movement_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inv_movement_material ON public.inventory_movements USING btree (material_id);


--
-- TOC entry 5100 (class 1259 OID 18797)
-- Name: idx_inv_movement_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inv_movement_ref ON public.inventory_movements USING btree (reference_type, reference_id);


--
-- TOC entry 5135 (class 1259 OID 18803)
-- Name: idx_payments_sale; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_sale ON public.payments USING btree (sale_id);


--
-- TOC entry 5095 (class 1259 OID 18802)
-- Name: idx_product_materials_mat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_materials_mat ON public.product_materials USING btree (material_id);


--
-- TOC entry 5096 (class 1259 OID 18801)
-- Name: idx_product_materials_prod; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_materials_prod ON public.product_materials USING btree (product_id);


--
-- TOC entry 5110 (class 1259 OID 18795)
-- Name: idx_quote_items_quote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quote_items_quote ON public.quote_items USING btree (quote_id);


--
-- TOC entry 5105 (class 1259 OID 18794)
-- Name: idx_quotes_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotes_client ON public.quotes USING btree (client_id);


--
-- TOC entry 5113 (class 1259 OID 18791)
-- Name: idx_sales_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_client ON public.sales USING btree (client_id);


--
-- TOC entry 5114 (class 1259 OID 18792)
-- Name: idx_sales_quote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_quote ON public.sales USING btree (quote_id);


--
-- TOC entry 5115 (class 1259 OID 18793)
-- Name: idx_sales_status_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_status_date ON public.sales USING btree (status, created_at);


--
-- TOC entry 5125 (class 1259 OID 18800)
-- Name: idx_tasks_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_employee ON public.production_tasks USING btree (employee_id);


--
-- TOC entry 5126 (class 1259 OID 18799)
-- Name: idx_tasks_work_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_work_order ON public.production_tasks USING btree (work_order_id);


--
-- TOC entry 5122 (class 1259 OID 18798)
-- Name: idx_work_orders_sale; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_orders_sale ON public.work_orders USING btree (sale_id);


--
-- TOC entry 5178 (class 2620 OID 18822)
-- Name: accounts trg_update_accounts; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_accounts BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5164 (class 2620 OID 18808)
-- Name: clients trg_update_clients; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_clients BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5165 (class 2620 OID 18809)
-- Name: employees trg_update_employees; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_employees BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5167 (class 2620 OID 18811)
-- Name: materials trg_update_materials; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_materials BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5170 (class 2620 OID 18814)
-- Name: pricing_rules trg_update_pricing_rules; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_pricing_rules BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5169 (class 2620 OID 18813)
-- Name: product_materials trg_update_product_materials; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_product_materials BEFORE UPDATE ON public.product_materials FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5176 (class 2620 OID 18820)
-- Name: production_tasks trg_update_production_tasks; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_production_tasks BEFORE UPDATE ON public.production_tasks FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5168 (class 2620 OID 18812)
-- Name: products trg_update_products; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5177 (class 2620 OID 18821)
-- Name: purchase_orders trg_update_purchase_orders; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_purchase_orders BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5172 (class 2620 OID 18816)
-- Name: quote_items trg_update_quote_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_quote_items BEFORE UPDATE ON public.quote_items FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5171 (class 2620 OID 18815)
-- Name: quotes trg_update_quotes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_quotes BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5174 (class 2620 OID 18818)
-- Name: sale_items trg_update_sale_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_sale_items BEFORE UPDATE ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5173 (class 2620 OID 18817)
-- Name: sales trg_update_sales; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_sales BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5166 (class 2620 OID 18810)
-- Name: suppliers trg_update_suppliers; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_suppliers BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5163 (class 2620 OID 18807)
-- Name: users trg_update_users; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5175 (class 2620 OID 18819)
-- Name: work_orders trg_update_work_orders; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_work_orders BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 5162 (class 2606 OID 18772)
-- Name: financial_movements financial_movements_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_movements
    ADD CONSTRAINT financial_movements_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- TOC entry 5146 (class 2606 OID 18510)
-- Name: inventory_movements inventory_movements_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- TOC entry 5160 (class 2606 OID 18751)
-- Name: payments payments_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- TOC entry 5161 (class 2606 OID 18746)
-- Name: payments payments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 5144 (class 2606 OID 18493)
-- Name: product_materials product_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_materials
    ADD CONSTRAINT product_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- TOC entry 5145 (class 2606 OID 18488)
-- Name: product_materials product_materials_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_materials
    ADD CONSTRAINT product_materials_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 18672)
-- Name: production_tasks production_tasks_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 5156 (class 2606 OID 18667)
-- Name: production_tasks production_tasks_work_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- TOC entry 5158 (class 2606 OID 18714)
-- Name: purchase_items purchase_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- TOC entry 5159 (class 2606 OID 18709)
-- Name: purchase_items purchase_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 5157 (class 2606 OID 18690)
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 5148 (class 2606 OID 18576)
-- Name: quote_items quote_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5149 (class 2606 OID 18571)
-- Name: quote_items quote_items_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 18546)
-- Name: quotes quotes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 5152 (class 2606 OID 18632)
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5153 (class 2606 OID 18627)
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- TOC entry 5150 (class 2606 OID 18599)
-- Name: sales sales_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 5151 (class 2606 OID 18604)
-- Name: sales sales_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id);


--
-- TOC entry 5154 (class 2606 OID 18649)
-- Name: work_orders work_orders_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2026-03-19 20:25:55

--
-- PostgreSQL database dump complete
--

\unrestrict 9Xu7DwrJKFUOfU6GOQBEusd7vXLaoIRWyoQeKoS9zJ3haxMqEDd8AGkoHLgSSm5

