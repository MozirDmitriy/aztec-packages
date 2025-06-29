// AUTOGENERATED FILE
#pragma once

#include <cstddef>
#include <string_view>
#include <tuple>

#include "../columns.hpp"
#include "barretenberg/relations/generic_lookup/generic_lookup_relation.hpp"
#include "barretenberg/vm2/constraining/relations/interactions_base.hpp"

namespace bb::avm2 {

/////////////////// lookup_scalar_mul_to_radix ///////////////////

struct lookup_scalar_mul_to_radix_settings_ {
    static constexpr std::string_view NAME = "LOOKUP_SCALAR_MUL_TO_RADIX";
    static constexpr std::string_view RELATION_NAME = "scalar_mul";
    static constexpr size_t LOOKUP_TUPLE_SIZE = 4;
    static constexpr Column SRC_SELECTOR = Column::scalar_mul_sel;
    static constexpr Column DST_SELECTOR = Column::to_radix_sel;
    static constexpr Column COUNTS = Column::lookup_scalar_mul_to_radix_counts;
    static constexpr Column INVERSES = Column::lookup_scalar_mul_to_radix_inv;
    static constexpr std::array<ColumnAndShifts, LOOKUP_TUPLE_SIZE> SRC_COLUMNS = {
        ColumnAndShifts::scalar_mul_scalar,
        ColumnAndShifts::scalar_mul_bit,
        ColumnAndShifts::scalar_mul_bit_idx,
        ColumnAndShifts::scalar_mul_bit_radix
    };
    static constexpr std::array<ColumnAndShifts, LOOKUP_TUPLE_SIZE> DST_COLUMNS = {
        ColumnAndShifts::to_radix_value,
        ColumnAndShifts::to_radix_limb,
        ColumnAndShifts::to_radix_limb_index,
        ColumnAndShifts::to_radix_radix
    };
};

using lookup_scalar_mul_to_radix_settings = lookup_settings<lookup_scalar_mul_to_radix_settings_>;
template <typename FF_>
using lookup_scalar_mul_to_radix_relation = lookup_relation_base<FF_, lookup_scalar_mul_to_radix_settings>;

/////////////////// lookup_scalar_mul_double ///////////////////

struct lookup_scalar_mul_double_settings_ {
    static constexpr std::string_view NAME = "LOOKUP_SCALAR_MUL_DOUBLE";
    static constexpr std::string_view RELATION_NAME = "scalar_mul";
    static constexpr size_t LOOKUP_TUPLE_SIZE = 9;
    static constexpr Column SRC_SELECTOR = Column::scalar_mul_not_end;
    static constexpr Column DST_SELECTOR = Column::ecc_sel;
    static constexpr Column COUNTS = Column::lookup_scalar_mul_double_counts;
    static constexpr Column INVERSES = Column::lookup_scalar_mul_double_inv;
    static constexpr std::array<ColumnAndShifts, LOOKUP_TUPLE_SIZE> SRC_COLUMNS = {
        ColumnAndShifts::scalar_mul_temp_x,        ColumnAndShifts::scalar_mul_temp_y,
        ColumnAndShifts::scalar_mul_temp_inf,      ColumnAndShifts::scalar_mul_temp_x_shift,
        ColumnAndShifts::scalar_mul_temp_y_shift,  ColumnAndShifts::scalar_mul_temp_inf_shift,
        ColumnAndShifts::scalar_mul_temp_x_shift,  ColumnAndShifts::scalar_mul_temp_y_shift,
        ColumnAndShifts::scalar_mul_temp_inf_shift
    };
    static constexpr std::array<ColumnAndShifts, LOOKUP_TUPLE_SIZE> DST_COLUMNS = {
        ColumnAndShifts::ecc_r_x, ColumnAndShifts::ecc_r_y, ColumnAndShifts::ecc_r_is_inf,
        ColumnAndShifts::ecc_p_x, ColumnAndShifts::ecc_p_y, ColumnAndShifts::ecc_p_is_inf,
        ColumnAndShifts::ecc_q_x, ColumnAndShifts::ecc_q_y, ColumnAndShifts::ecc_q_is_inf
    };
};

using lookup_scalar_mul_double_settings = lookup_settings<lookup_scalar_mul_double_settings_>;
template <typename FF_>
using lookup_scalar_mul_double_relation = lookup_relation_base<FF_, lookup_scalar_mul_double_settings>;

/////////////////// lookup_scalar_mul_add ///////////////////

struct lookup_scalar_mul_add_settings_ {
    static constexpr std::string_view NAME = "LOOKUP_SCALAR_MUL_ADD";
    static constexpr std::string_view RELATION_NAME = "scalar_mul";
    static constexpr size_t LOOKUP_TUPLE_SIZE = 9;
    static constexpr Column SRC_SELECTOR = Column::scalar_mul_should_add;
    static constexpr Column DST_SELECTOR = Column::ecc_sel;
    static constexpr Column COUNTS = Column::lookup_scalar_mul_add_counts;
    static constexpr Column INVERSES = Column::lookup_scalar_mul_add_inv;
    static constexpr std::array<ColumnAndShifts, LOOKUP_TUPLE_SIZE> SRC_COLUMNS = {
        ColumnAndShifts::scalar_mul_res_x,       ColumnAndShifts::scalar_mul_res_y,
        ColumnAndShifts::scalar_mul_res_inf,     ColumnAndShifts::scalar_mul_res_x_shift,
        ColumnAndShifts::scalar_mul_res_y_shift, ColumnAndShifts::scalar_mul_res_inf_shift,
        ColumnAndShifts::scalar_mul_temp_x,      ColumnAndShifts::scalar_mul_temp_y,
        ColumnAndShifts::scalar_mul_temp_inf
    };
    static constexpr std::array<ColumnAndShifts, LOOKUP_TUPLE_SIZE> DST_COLUMNS = {
        ColumnAndShifts::ecc_r_x, ColumnAndShifts::ecc_r_y, ColumnAndShifts::ecc_r_is_inf,
        ColumnAndShifts::ecc_p_x, ColumnAndShifts::ecc_p_y, ColumnAndShifts::ecc_p_is_inf,
        ColumnAndShifts::ecc_q_x, ColumnAndShifts::ecc_q_y, ColumnAndShifts::ecc_q_is_inf
    };
};

using lookup_scalar_mul_add_settings = lookup_settings<lookup_scalar_mul_add_settings_>;
template <typename FF_>
using lookup_scalar_mul_add_relation = lookup_relation_base<FF_, lookup_scalar_mul_add_settings>;

} // namespace bb::avm2
