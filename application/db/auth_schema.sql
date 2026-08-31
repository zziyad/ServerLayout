--
-- PostgreSQL database dump
-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0; -- PostgreSQL 17+ only, commented out for compatibility
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Department" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id uuid
);


--
-- Name: TABLE "Department"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Department" IS 'Dynamic department management - can add departments dynamically (airport, hotel, venue, management, etc.)';


--
-- Name: DepartmentRole; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DepartmentRole" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE "DepartmentRole"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."DepartmentRole" IS 'Dynamic department role templates - can add role templates dynamically (manager, supervisor, clerk, etc.)';


--
-- Name: DepartmentRoleAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DepartmentRoleAssignment" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    department_id uuid NOT NULL,
    role_template_id uuid,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(150) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE "DepartmentRoleAssignment"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."DepartmentRoleAssignment" IS 'Department-specific roles - each department can have its own set of roles (links Department to DepartmentRole)';


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Permission" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    resource character varying(100) NOT NULL,
    action character varying(100) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE "Permission"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Permission" IS 'Permissions define what actions can be performed on resources (format: resource.action). is_system=true permissions should be protected from deletion/modification at application level.';


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(150) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE "Role"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Role" IS 'System roles for access control';


--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RolePermission" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    granted_by uuid NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: TABLE "RolePermission"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."RolePermission" IS 'Many-to-many relationship between Roles and Permissions. granted_by is NOT NULL - all permissions must be explicitly granted by a user (or system user for is_system permissions).';


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(64),
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    display_name character varying(150),
    avatar_url character varying(500),
    phone character varying(20),
    "position" character varying(100),
    employee_id character varying(50),
    hire_date date,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    last_login_at timestamp with time zone,
    last_activity_at timestamp with time zone,
    password_reset_token character varying(128),
    password_reset_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    department_role_assignment_id uuid,
    preferences jsonb DEFAULT jsonb_build_object() NOT NULL
);


--
-- Name: TABLE "User"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."User" IS 'System users with role-based access control (UUID, soft delete)';


--
-- Name: COLUMN "User".department_role_assignment_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User".department_role_assignment_id IS 'Authoritative source for user department and role. References DepartmentRoleAssignment which links Department + DepartmentRole template. This is the ONLY way to define department roles - all other department/role fields have been removed to avoid ambiguity.';


--
-- Name: UserPermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserPermission" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    is_granted boolean NOT NULL,
    granted_by uuid NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    reason text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: TABLE "UserPermission"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."UserPermission" IS 'Direct user permissions (bypass roles, can grant or revoke). PERMISSION RESOLUTION ORDER: 1) UserPermission (explicit allow/deny - highest priority), 2) UserRole → RolePermission, 3) DepartmentRoleAssignment → implied permissions (if any), 4) Default deny. Cache resolved permissions in production and invalidate on Role/Permission/UserPermission changes.';


--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserRole" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_role_not_expired CHECK (((expires_at IS NULL) OR (expires_at > now())))
);


--
-- Name: TABLE "UserRole"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."UserRole" IS 'Many-to-many relationship between Users and Roles';


--
-- Name: DepartmentRoleAssignment DepartmentRoleAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DepartmentRoleAssignment"
    ADD CONSTRAINT "DepartmentRoleAssignment_pkey" PRIMARY KEY (id);


--
-- Name: DepartmentRole DepartmentRole_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DepartmentRole"
    ADD CONSTRAINT "DepartmentRole_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: UserPermission UserPermission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserPermission"
    ADD CONSTRAINT "UserPermission_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: idx_department_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_department_code ON public."Department" USING btree (code) WHERE (is_deleted = false);


--
-- Name: idx_department_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_department_is_active ON public."Department" USING btree (is_active) WHERE (is_deleted = false);


--
-- Name: idx_department_role_assignment_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_department_role_assignment_department ON public."DepartmentRoleAssignment" USING btree (department_id) WHERE (is_deleted = false);


--
-- Name: idx_department_role_assignment_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_department_role_assignment_template ON public."DepartmentRoleAssignment" USING btree (role_template_id) WHERE (is_deleted = false);


--
-- Name: idx_department_role_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_department_role_code ON public."DepartmentRole" USING btree (code) WHERE (is_deleted = false);


--
-- Name: idx_department_role_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_department_role_is_active ON public."DepartmentRole" USING btree (is_active) WHERE (is_deleted = false);


--
-- Name: idx_permission_resource_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permission_resource_action ON public."Permission" USING btree (resource, action) WHERE (is_deleted = false);


--
-- Name: ux_department_code; Type: UNIQUE INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_department_code ON public."Department"(code) WHERE (is_deleted = false);


--
-- Name: ux_department_role_code; Type: UNIQUE INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_department_role_code ON public."DepartmentRole"(code) WHERE (is_deleted = false);


--
-- Name: ux_permission_resource_action; Type: UNIQUE INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_permission_resource_action ON public."Permission"(resource, action) WHERE (is_deleted = false);


--
-- Name: ux_user_role_active; Type: UNIQUE INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_user_role_active ON public."UserRole"(user_id, role_id) WHERE (is_deleted = false AND is_active = true);


--
-- Name: ux_user_email; Type: UNIQUE INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_user_email ON public."User"(email) WHERE (is_deleted = false);


--
-- Name: ux_user_username; Type: UNIQUE INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_user_username ON public."User"(username) WHERE (is_deleted = false AND username IS NOT NULL);


--
-- Name: ux_role_name; Type: UNIQUE INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_role_name ON public."Role"(name) WHERE (is_deleted = false);


--
-- Name: idx_role_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_is_active ON public."Role" USING btree (is_active) WHERE (is_deleted = false);


--
-- Name: idx_role_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_name ON public."Role" USING btree (name) WHERE (is_deleted = false);


--
-- Name: idx_role_permission_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permission_permission ON public."RolePermission" USING btree (permission_id) WHERE (is_deleted = false);


--
-- Name: idx_role_permission_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permission_role ON public."RolePermission" USING btree (role_id) WHERE (is_deleted = false);


--
-- Name: idx_user_department_role_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_department_role_assignment ON public."User" USING btree (department_role_assignment_id) WHERE (is_deleted = false);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_email ON public."User" USING btree (email) WHERE (is_deleted = false);


--
-- Name: idx_user_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_is_active ON public."User" USING btree (is_active) WHERE (is_deleted = false);


--
-- Name: idx_user_permission_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permission_permission ON public."UserPermission" USING btree (permission_id) WHERE (is_deleted = false);


--
-- Name: idx_user_permission_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permission_user ON public."UserPermission" USING btree (user_id) WHERE (is_deleted = false);


--
-- Name: idx_user_role_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_role_role ON public."UserRole" USING btree (role_id) WHERE ((is_deleted = false) AND (is_active = true));


--
-- Name: idx_user_role_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_role_user ON public."UserRole" USING btree (user_id) WHERE ((is_deleted = false) AND (is_active = true));


--
-- Name: idx_user_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_username ON public."User" USING btree (username) WHERE ((is_deleted = false) AND (username IS NOT NULL));


--
-- Name: DepartmentRoleAssignment DepartmentRoleAssignment_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DepartmentRoleAssignment"
    ADD CONSTRAINT "DepartmentRoleAssignment_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public."Department"(id) ON DELETE CASCADE;


--
-- Name: DepartmentRoleAssignment DepartmentRoleAssignment_role_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DepartmentRoleAssignment"
    ADD CONSTRAINT "DepartmentRoleAssignment_role_template_id_fkey" FOREIGN KEY (role_template_id) REFERENCES public."DepartmentRole"(id) ON DELETE SET NULL;


--
-- Name: RolePermission RolePermission_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES public."User"(id) ON DELETE RESTRICT;


--
-- Name: RolePermission RolePermission_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES public."Permission"(id) ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Role"(id) ON DELETE CASCADE;


--
-- Name: UserPermission UserPermission_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserPermission"
    ADD CONSTRAINT "UserPermission_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES public."User"(id) ON DELETE RESTRICT;


--
-- Name: UserPermission UserPermission_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserPermission"
    ADD CONSTRAINT "UserPermission_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES public."Permission"(id) ON DELETE CASCADE;


--
-- Name: UserPermission UserPermission_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserPermission"
    ADD CONSTRAINT "UserPermission_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: UserRole UserRole_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES public."User"(id) ON DELETE RESTRICT;


--
-- Name: UserRole UserRole_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Role"(id) ON DELETE CASCADE;


--
-- Name: UserRole UserRole_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: User User_department_role_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_department_role_assignment_id_fkey" FOREIGN KEY (department_role_assignment_id) REFERENCES public."DepartmentRoleAssignment"(id) ON DELETE SET NULL;


--
-- Name: User trg_user_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_updated BEFORE UPDATE ON public."User" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: Department trg_department_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_department_updated BEFORE UPDATE ON public."Department" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: DepartmentRole trg_department_role_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_department_role_updated BEFORE UPDATE ON public."DepartmentRole" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: DepartmentRoleAssignment trg_department_role_assignment_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_department_role_assignment_updated BEFORE UPDATE ON public."DepartmentRoleAssignment" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: Role trg_role_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_role_updated BEFORE UPDATE ON public."Role" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- PostgreSQL database dump complete
--
