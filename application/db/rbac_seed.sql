--
-- PostgreSQL database dump
--

--\restrict 4weIaWccffukQVW8GgyzrynQfkeppT0eyOa27C5IAQu6g4PzsvExWYQdUEgEami

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg13+1)
-- Dumped by pg_dump version 17.9 (Debian 17.9-1.pgdg13+1)

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
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: zi
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public."Permission" DISABLE TRIGGER ALL;

INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('ade406f5-fe3b-4d91-8656-fe22a7cab8c5', 'permission', 'read', 'List and view permissions', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('0e68918b-9398-4a6a-a8d5-7db774f1e7fc', 'permission', 'create', 'Create new permissions', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('f4cb7c06-dab4-4804-8f7a-72860e86977f', 'permission', 'update', 'Update permissions', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('18796315-e935-49fc-8605-369eb8865691', 'permission', 'delete', 'Delete (soft) permissions', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('e61c58c7-80a6-4064-ab43-ea44d6944f25', 'department', 'read', 'List and view departments', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('c66f714f-dc00-4956-942b-553798c51a63', 'department', 'create', 'Create departments', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('4f371327-3715-4aeb-9f93-6966f2bcf4ac', 'department', 'update', 'Update departments', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('45815f96-15ff-4aef-b574-a93609cf76ad', 'department', 'delete', 'Delete departments', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('8b81e644-b7ca-40b0-bf35-4402ba994855', 'department.role', 'list', 'List roles within a department', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('8f6e0cc8-6e29-4682-9be3-77b7e3329f99', 'department.role', 'create', 'Add role to a department', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('daeff85b-8e18-484f-800b-48ac765e001f', 'department.role', 'update', 'Update department role', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('c374e4cb-ea35-42ec-afe9-75d5b9008aa4', 'department.role', 'delete', 'Remove role from department', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('58891511-1fca-42bb-8fce-ba5e13176548', 'user', 'create', 'Create users', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('5e61e614-9382-4b83-8698-908e901e3fd6', 'user', 'read', 'Read users', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('b9a2d895-ab0b-4f53-815e-a2565b85154e', 'user', 'update', 'Update users', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('096f3278-ee2d-499e-9895-b1c55484fc70', 'user', 'delete', 'Delete users', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('31cf74d8-0315-4371-a9fb-1478ac2ce9de', 'user', 'assign_roles', 'Assign or remove roles on users', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('31e31698-25ff-4378-9a87-c789c11e9427', 'role', 'read', 'List and read roles', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('9c36710e-1de9-42d5-93ed-dd59a370613e', 'role', 'create', 'Create roles', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('fae3cc84-609b-482f-81e9-de1c2f321128', 'role', 'update', 'Update roles', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('0fed907b-59da-4fb1-88da-52dc8478ca43', 'role', 'delete', 'Delete roles', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('adf40fb3-4134-45b3-bbbb-3b8d28e7ff8e', 'role', 'assign_permission', 'Assign permission to role', true, false, NULL, '2026-04-22 01:53:58.310204-04');
INSERT INTO public."Permission" (id, resource, action, description, is_system, is_deleted, deleted_at, created_at) VALUES ('0dae72f5-fdce-4110-b9e6-b462acddc04d', 'role', 'remove_permission', 'Remove permission from role', true, false, NULL, '2026-04-22 01:53:58.310204-04');


ALTER TABLE public."Permission" ENABLE TRIGGER ALL;

--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: zi
--

ALTER TABLE public."Role" DISABLE TRIGGER ALL;

INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at) VALUES ('04d2c81b-d348-4d93-b86b-e775f9b2443b', 'super_admin', 'Super Administrator', 'Full access; bypasses all permission checks.', true, true, false, NULL, '2026-04-21 05:22:16.339853-04', '2026-04-21 05:22:16.339853-04');
INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at) VALUES ('7cb3bc19-e487-4007-b597-eb39c74fc11b', 'admin', 'Administrator', 'Administrative access for user and system management.', true, true, false, NULL, '2026-04-21 05:22:16.339853-04', '2026-05-02 08:10:14.252103-04');
INSERT INTO public."Role" (id, name, display_name, description, is_system, is_active, is_deleted, deleted_at, created_at, updated_at) VALUES ('4c9b4043-8a0c-491a-b379-a7a8a391d925', 'app_user', 'App User', 'Base internal application user role.', true, true, false, NULL, '2026-05-02 18:29:16.245304-04', '2026-05-04 06:53:31.631114-04');


ALTER TABLE public."Role" ENABLE TRIGGER ALL;

--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: zi
--

ALTER TABLE public."RolePermission" DISABLE TRIGGER ALL;

INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('1e598a04-b225-4b14-bc44-745c26d63887', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'c66f714f-dc00-4956-942b-553798c51a63', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:44.979696-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('b6799e65-f6ff-41fd-aa70-41a61e96abcd', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '45815f96-15ff-4aef-b574-a93609cf76ad', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:44.996486-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('badcecce-c418-4483-9861-f3ca9e6bbef1', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'e61c58c7-80a6-4064-ab43-ea44d6944f25', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.010707-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('7669c4f4-c5a5-49a5-9fa4-72038fe09f90', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '4f371327-3715-4aeb-9f93-6966f2bcf4ac', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.035736-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('31fb10d8-ddf6-49f5-8dc3-0ece02b8476c', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '8f6e0cc8-6e29-4682-9be3-77b7e3329f99', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.037422-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('9e2e00c4-e43f-4b8d-920c-73633ac63613', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'c374e4cb-ea35-42ec-afe9-75d5b9008aa4', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.045988-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('c243942a-f97e-43c6-ba3b-3aa19a64066e', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '8b81e644-b7ca-40b0-bf35-4402ba994855', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.052611-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('61530a88-1689-4f49-b236-7ddd1231d602', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'daeff85b-8e18-484f-800b-48ac765e001f', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.152396-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('6c243e31-f272-4298-af46-11443da7f734', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'ade406f5-fe3b-4d91-8656-fe22a7cab8c5', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.16526-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('d2159dc3-5300-4a4a-8c93-ef8bdbcce780', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'b9a2d895-ab0b-4f53-815e-a2565b85154e', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.168797-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('bc857813-c6b4-4376-b8ab-5f4ba330e520', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '18796315-e935-49fc-8605-369eb8865691', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.181254-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('b6acc4e9-5b42-4a46-ae81-f2cb3eb1cba8', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '5e61e614-9382-4b83-8698-908e901e3fd6', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.189543-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('e2544085-e27d-4f21-8fce-234bcf74c1de', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'f4cb7c06-dab4-4804-8f7a-72860e86977f', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.193962-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('50ef13b8-894a-4e0e-af7e-0beca97fb5a4', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '58891511-1fca-42bb-8fce-ba5e13176548', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.196957-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('6c41148e-442d-4aee-b3d5-5ed328634560', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '0e68918b-9398-4a6a-a8d5-7db774f1e7fc', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.213583-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('0f405213-710c-4ae9-bcaa-e3ece4daaf31', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '096f3278-ee2d-499e-9895-b1c55484fc70', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.213858-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('a42cd20d-f435-4c7f-878d-b75bdfc3f075', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'adf40fb3-4134-45b3-bbbb-3b8d28e7ff8e', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.215613-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('fe5ceeb0-504e-415a-9cc0-daf4691b2186', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '9c36710e-1de9-42d5-93ed-dd59a370613e', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.224101-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('3fd55634-33c4-44db-a9e8-7b80fd25c22d', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '31cf74d8-0315-4371-a9fb-1478ac2ce9de', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.224415-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('774975d6-03bb-4d43-955d-2dafc18f8275', '7cb3bc19-e487-4007-b597-eb39c74fc11b', 'fae3cc84-609b-482f-81e9-de1c2f321128', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.233012-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('30017785-939a-465b-82e1-b0abd275d381', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '0fed907b-59da-4fb1-88da-52dc8478ca43', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.241759-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('47bdfb70-28f7-4876-9f8a-7c4d565a9c36', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '0dae72f5-fdce-4110-b9e6-b462acddc04d', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.246988-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('a994db23-1955-42b6-924c-b2f6da67cf57', '7cb3bc19-e487-4007-b597-eb39c74fc11b', '31e31698-25ff-4378-9a87-c789c11e9427', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 08:28:45.255015-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('cd2db8ce-e233-430a-a033-69d781f3f6f9', '4c9b4043-8a0c-491a-b379-a7a8a391d925', '5e61e614-9382-4b83-8698-908e901e3fd6', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 18:29:16.245304-04', false, NULL);
INSERT INTO public."RolePermission" (id, role_id, permission_id, granted_by, granted_at, is_deleted, deleted_at) VALUES ('0e6397e8-16f3-40ec-a4e1-07da5c78b145', '4c9b4043-8a0c-491a-b379-a7a8a391d925', 'b9a2d895-ab0b-4f53-815e-a2565b85154e', 'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3', '2026-05-02 18:29:16.245304-04', false, NULL);


ALTER TABLE public."RolePermission" ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

--\unrestrict 4weIaWccffukQVW8GgyzrynQfkeppT0eyOa27C5IAQu6g4PzsvExWYQdUEgEami

